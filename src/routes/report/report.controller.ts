import {
  Controller,
  Post,
  Param,
  Get,
  Res,
  HttpException,
  HttpStatus,
  Query,
  Logger,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { Response } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';
import { BullService } from 'src/shared/services/bull/bull.service';
import { IReportLogFilter } from 'src/shared/interfaces/report.interface';
import { GetLogsDto } from './dtos/get-report.dto';
import { instanceToPlain } from 'class-transformer';
import { ReportStatus } from 'src/shared/enums/reports.enums';

@Controller('reports')
export class ReportController {
  private readonly logger = new Logger(ReportController.name);
  constructor(
    private readonly reportService: ReportService,
    private readonly bullService: BullService,
  ) {}

  @Get()
  async getLogs(@Query() dto?: GetLogsDto) {
    const filter: IReportLogFilter = {};
    if (dto.campaignId) filter.campaignId = dto.campaignId;
    if (dto.status) filter.status = dto.status as ReportStatus;

    const logs = await this.reportService.getReportLogs(
      filter,
      instanceToPlain(dto),
    );

    return logs;
  }

  @Post(':campaignId/generate')
  async generate(@Param('campaignId') id: string) {
    await this.bullService.queuePDFGeneration(id);
    return {
      message: 'Report generation queued',
      viewUrl: `/reports/${id}/view`,
      downloadUrl: `/reports/${id}/download`,
    };
  }

  @Get(':campaignId/view')
  async view(@Param('campaignId') id: string, @Res() res: Response) {
    const html = await this.reportService.renderHTML(id);
    res.send(html);
  }

  @Get(':campaignId/download')
  async download(@Param('campaignId') id: string, @Res() res: Response) {
    const filePath = path.join(__dirname, `../../reports/${id}.pdf`);
    if (!(await fs.pathExists(filePath))) {
      throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${id}.pdf"`,
    });

    fs.createReadStream(filePath).pipe(res);
  }

  @Post(':campaignId/manual')
  async manual(@Param('campaignId') id: string) {
    const response = await this.reportService.generateAndSaveReport(id);

    return response;
  }

  @Post(':logId/retry')
  async retryFailedReport(@Param('logId') logId: string) {
    const response = await this.reportService.retryFailedReport(logId);

    return response;
  }
}
