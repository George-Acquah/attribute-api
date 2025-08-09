import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { REPORT_QUEUE, GENERATE_PDF_JOB } from '../constants/bull.constants';
import { Logger } from '@nestjs/common';

@Processor(REPORT_QUEUE)
export class ReportProcessor {
  private readonly logger = new Logger(ReportProcessor.name);
  @Process(GENERATE_PDF_JOB)
  async handlePDFGeneration(job: Job<{ campaignId: string }>) {
    this.logger.log(`Starting PDF generation for ${job.data.campaignId}`);

    try {
      // Your PDF generation logic here
      // await this.generatePDF(job.data.campaignId);

      this.logger.log(`Completed PDF generation for ${job.data.campaignId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to generate PDF for ${job.data.campaignId}`,
        error.stack,
      );
      throw error;
    }
  }
}
