import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import {
  REPORT_QUEUE,
  GENERATE_PDF_JOB,
} from 'src/shared/constants/bull.constants';

@Injectable()
export class BullService {
  private readonly logger = new Logger(BullService.name);
  constructor(@InjectQueue(REPORT_QUEUE) private readonly reportQueue: Queue) {}

  async queuePDFGeneration(campaignId: string) {
    try {
      this.logger.log(
        `Queued PDF generation for campaign ${campaignId} about to begin`,
      );
      const job = await this.reportQueue.add(
        GENERATE_PDF_JOB,
        {
          campaignId,
          timestamp: new Date().toISOString(),
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(
        `Queued PDF generation job ${job.id} for campaign ${campaignId}`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to queue PDF generation for campaign ${campaignId}`,
        error.stack,
      );
      throw error;
    }
  }
}
