import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs-extra';
import * as path from 'path';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import {
  ICreateReportLogInput,
  IReportLogFilter,
} from 'src/shared/interfaces/report.interface';
import {
  BadRequestResponse,
  CreatedResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  OkResponse,
} from 'src/shared/res/api.response';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { _IPaginationWithDatesParams } from 'src/shared/interfaces/pagination.interface';
import { Prisma, ReportLog } from '@prisma/client';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  constructor(
    private prisma: PrismaService,
    private pagination: PaginationService,
  ) {}

  async getReportLogs(
    filters: IReportLogFilter,
    dto?: _IPaginationWithDatesParams,
  ) {
    try {
      const where: Prisma.ReportLogWhereInput = {};

      if (filters.campaignId) {
        where.campaignId = filters.campaignId;
      }
      if (filters.status) {
        where.status = filters.status;
      }

      if (dto?.startDate || dto?.endDate) {
        where.createdAt = {
          ...(dto.startDate && { gte: dto.startDate }),
          ...(dto.endDate && { lte: dto.endDate }),
        };
      }

      return await this.pagination.paginateAndFilter<
        ReportLog,
        typeof where,
        Prisma.ReportLogInclude,
        Prisma.ReportLogOrderByWithRelationInput
      >(
        {
          findMany: (args) => this.prisma.reportLog.findMany(args),
          count: (args) => this.prisma.reportLog.count(args),
        },
        {
          page: dto?.page,
          limit: dto?.limit,
          where,
          searchFields: ['fileName', 'status'],
          searchValue: dto?.query,
          include: {
            campaign: {
              select: {
                name: true,
                id: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          message: 'Report logs fetched successfully',
        },
      );
    } catch (err) {
      this.logger.error('Failed to fetch report logs', err);
      return new InternalServerErrorResponse('Failed to fetch report logs');
    }
  }

  async getReportLogById(id: string) {
    try {
      const result = await this.prisma.reportLog.findUnique({
        where: { id },
        include: {
          campaign: {
            select: {
              name: true,
              id: true,
            },
          },
        },
      });

      if (!result) {
        return new NotFoundResponse('Report log not found');
      }

      return new OkResponse(result, 'Report log fetched successfully');
    } catch (err) {
      this.logger.error(`Failed to fetch report log with id ${id}`, err);
      return new InternalServerErrorResponse(
        `Failed to fetch report log with id ${id}`,
      );
    }
  }

  async retryFailedReport(id: string) {
    try {
      const reportLog = await this.prisma.reportLog.findUnique({
        where: { id },
      });

      if (!reportLog) return new NotFoundResponse('Report log not found');

      if (reportLog.status !== 'failed')
        return new BadRequestResponse('Only failed reports can be retried.');

      if (reportLog.retryCount >= 3)
        return new BadRequestResponse('Max retry attempts reached (3)');

      await this.generateAndSaveReport(
        reportLog.campaignId,
        reportLog.retryCount,
        reportLog.id,
        'Report generation retried successfully',
        `Failed to retry report with id ${id}`,
      );
    } catch (err) {
      this.logger.error(`Failed to retry report with id ${id}`, err);
      return new InternalServerErrorResponse(
        `Failed to retry report with id ${id}`,
      );
    }
  }

  async retryAllFailed() {
    try {
      const failedLogs = await this.prisma.reportLog.findMany({
        where: {
          status: 'failed',
          retryCount: { lt: 3 }, // Only retry up to 3 times
        },
        distinct: ['campaignId'], // Get unique campaign IDs
      });

      const results = await Promise.all(
        failedLogs.map(async (log) => {
          try {
            const result = await this.generateAndSaveReport(
              log.campaignId,
              log.retryCount,
              log.id,
              'Report generation retried successfully',
              `Failed to retry report with id ${log.id}`,
            );

            if (result instanceof InternalServerErrorResponse) {
              return {
                campaignId: log.campaignId,
                status: 'failed' as const,
                error: result.message,
              };
            }

            return {
              campaignId: log.campaignId,
              status: 'success' as const,
            };
          } catch (error) {
            this.logger.error(
              `Failed to retry report for campaign ${log.campaignId}`,
              error,
            );
            return {
              campaignId: log.campaignId,
              status: 'failed' as const,
              error: error.message,
            };
          }
        }),
      );

      return new OkResponse(results, 'Retry results for failed reports');
    } catch (error) {
      this.logger.error('Failed to fetch failed report logs', error);
      return new InternalServerErrorResponse(
        'Failed to process retry requests',
      );
    }
  }

  async getCampaignData(campaignId: string) {
    return this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        codes: true,
        region: true,
        channel: true,
        funnelSteps: {
          orderBy: { order: 'asc' },
        },
        // kPI: true,
      },
    });
  }

  async renderHTML(campaignId: string) {
    try {
      const campaign = await this.getCampaignData(campaignId);

      if (!campaign) {
        return new NotFoundResponse(`No campaign found with ID: ${campaignId}`);
      }

      const filePath = path.join(__dirname, 'templates', 'report.hbs');

      if (!(await fs.pathExists(filePath))) {
        return new NotFoundResponse(`Template file not found: ${filePath}`);
      }

      const source = await fs.readFile(filePath, 'utf8');
      const template = Handlebars.compile(source);

      const templateResult = template(campaign);

      return new OkResponse(templateResult, 'HTML rendered successfully.');
    } catch (err) {
      this.logger.error(
        `Error rendering HTML for campaign ${campaignId}`,
        err instanceof Error ? err.stack : String(err),
      );
      return new InternalServerErrorResponse(
        `Failed to render HTML for campaign ${campaignId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  async generatePDF(campaignId: string) {
    let browser: puppeteer.Browser | null = null;

    try {
      const htmlResult = await this.renderHTML(campaignId);
      if (!htmlResult.data || htmlResult.statusCode !== HttpStatus.OK) {
        return htmlResult;
      }

      this.logger.log(
        `Puppeteer executable path from env: ${process.env.PUPPETEER_EXECUTABLE_PATH}`,
      );

      browser = await puppeteer.launch({
        headless: true,
        executablePath:
          process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      this.logger.log('Puppeteer launched successfully');

      const page = await browser.newPage();

      await page.setContent(htmlResult.data, { waitUntil: 'networkidle0' });

      this.logger.log(`Generating PDF for campaign: ${campaignId}`);
      const pdfPath = path.join(__dirname, `../../reports/${campaignId}.pdf`);
      this.logger.log(`PDF will be saved to: ${pdfPath}`);

      await fs.ensureDir(path.dirname(pdfPath));
      await page.pdf({ path: pdfPath, format: 'A4' });

      return new OkResponse(pdfPath);
    } catch (err) {
      this.logger.error(
        `Error generating PDF for campaign ${campaignId}`,
        err instanceof Error ? err.stack : err,
      );
      return new InternalServerErrorResponse(
        `PDF generation failed for campaign ${campaignId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeErr) {
          this.logger.warn(
            `Failed to close Puppeteer browser for campaign ${campaignId}: ${
              closeErr instanceof Error ? closeErr.message : String(closeErr)
            }`,
          );
        }
      }
    }
  }

  async generateAndSaveReport(
    campaignId: string,
    retryCount = 0,
    logId?: string,
    successMsg = 'Report generated successfully',
    errorMsg = 'Failed to generate report',
  ) {
    try {
      const filePathResult = await this.generatePDF(campaignId);

      if (!filePathResult.data || filePathResult.statusCode !== HttpStatus.OK) {
        return filePathResult;
      }

      await this.createReport({
        campaignId,
        filePath: filePathResult.data,
        fileName: `${campaignId}.pdf`,
        retryCount,
        userId: null, // system-run
        status: 'success',
      });

      return new CreatedResponse(
        {
          filePath: filePathResult.data,
          downloadUrl: `/reports/${campaignId}/download`,
        },
        successMsg,
      );
    } catch (err) {
      this.logger.error(
        `Failed to generate report for campaign ${campaignId}`,
        err instanceof Error ? err.stack : err,
      );
      await this.createReport({
        logId,
        campaignId,
        filePath: '',

        fileName: '',
        status: 'failed',
        retryCount,
        userId: null,
        error: err instanceof Error ? err.message : String(err),
      });

      return new InternalServerErrorResponse(errorMsg);
    }
  }

  private async createReport(log: ICreateReportLogInput) {
    await this.prisma.reportLog.upsert({
      where: { id: log.logId || '' },
      create: {
        campaignId: log.campaignId,
        filePath: log.filePath,
        fileName: log.fileName,
        status: log.status,

        retryCount: log.retryCount || 0,
        userId: log.userId || null,
        error: log.error || null,
      },
      update: {
        filePath: log.filePath,
        fileName: log.fileName,
        status: log.status,
        retryCount: log.retryCount + 1,
        userId: log.userId || null,
        error: log.error || null,
      },
    });
  }
}
