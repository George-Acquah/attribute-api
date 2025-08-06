import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { REPORT_QUEUE, GENERATE_PDF_JOB } from '../constants/bull.constants';

@Processor(REPORT_QUEUE)
export class ReportProcessor {
  @Process(GENERATE_PDF_JOB)
  async handleGeneratePDF(job: Job<{ campaignId: string }>) {
    const { campaignId } = job.data;
    // 🔧 Call PDF generation logic here
    console.log(`Generating PDF for campaign ${campaignId}`);
  }
}
