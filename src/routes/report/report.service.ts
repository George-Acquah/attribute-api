import { Injectable, Logger } from '@nestjs/common';
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
        reportLog.retryCount + 1,
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
              log.retryCount + 1,
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

  async renderHTML(campaignId: string): Promise<string> {
    const campaign = await this.getCampaignData(campaignId);

    const filePath = path.join(__dirname, 'templates', 'report.hbs');
    const source = await fs.readFile(filePath, 'utf8');
    const template = Handlebars.compile(source);

    return template(campaign);
  }

  async generatePDF(campaignId: string): Promise<string> {
    const html = await this.renderHTML(campaignId);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfPath = path.join(__dirname, `../../reports/${campaignId}.pdf`);
    await fs.ensureDir(path.dirname(pdfPath));
    await page.pdf({ path: pdfPath, format: 'A4' });

    await browser.close();
    return pdfPath;
  }

  async generateAndSaveReport(
    campaignId: string,
    retryCount = 0,
    successMsg = 'Report generated successfully',
    errorMsg = 'Failed to generate report',
  ) {
    try {
      const filePath = await this.generatePDF(campaignId);

      await this.createReport({
        campaignId,
        filePath,
        fileName: `${campaignId}.pdf`,
        retryCount,
        userId: null, // system-run
        status: 'success',
      });

      return new CreatedResponse(
        {
          filePath,
          downloadUrl: `/reports/${campaignId}/download`,
        },
        successMsg,
      );
    } catch (err) {
      await this.createReport({
        campaignId,
        filePath: '',
        status: 'failed',
        retryCount,
        userId: null, // system-run
        error: err.message,
      });

      return new InternalServerErrorResponse(errorMsg);
    }
  }

  private async createReport(log: ICreateReportLogInput) {
    await this.prisma.reportLog.create({
      data: {
        campaignId: log.campaignId,
        filePath: log.filePath,
        fileName: log.fileName,
        status: log.status,

        retryCount: log.retryCount || 0,
        userId: log.userId || null,
        error: log.error || null,
      },
    });
  }
}
