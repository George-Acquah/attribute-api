import { Job } from 'bull';
import { REPORT_QUEUE, GENERATE_PDF_JOB } from '../constants/bull.constants';
import { ReportService } from 'src/routes/report/report.service';
import { handleError } from '../utils/errors';
import { Processor } from '@nestjs/bull/dist/decorators/processor.decorator';
import { Process } from '@nestjs/bull/dist/decorators/process.decorator';
import { Logger } from '@nestjs/common/services/logger.service';

@Processor(REPORT_QUEUE)
export class ReportProcessor {
  private readonly logger = new Logger(ReportProcessor.name);
  constructor(private readonly reportService: ReportService) {}
  @Process(GENERATE_PDF_JOB)
  async handlePDFGeneration(job: Job<{ campaignId: string }>) {
    this.logger.log(`Starting PDF generation for ${job.data.campaignId}`);

    try {
      // Your PDF generation logic here
      // await this.generatePDF(job.data.campaignId);
      const result = await this.reportService.generateAndSaveReport(
        job.data.campaignId,
      );

      this.logger.log(`Completed PDF generation for ${job.data.campaignId}`);

      return result;
    } catch (error) {
      return handleError(
        `handlePDFGeneration`,
        error,
        `Failed to generate PDF for ${job.data.campaignId}`,
      );
    }
  }
}
