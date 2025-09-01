import { InjectQueue } from '@nestjs/bull/dist/decorators/inject-queue.decorator';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';
import { Queue } from 'bull';
import {
  REPORT_QUEUE,
  GENERATE_PDF_JOB,
  WEBHOOK_QUEUE,
} from 'src/shared/constants/bull.constants';

@Injectable()
export class BullService {
  private readonly logger = new Logger(BullService.name);
  constructor(
    @InjectQueue(REPORT_QUEUE) private readonly reportQueue: Queue,
    @InjectQueue(WEBHOOK_QUEUE) private readonly webhookQueue: Queue,
  ) {}

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

  async queueWebhook(campaignId: string, data: any) {
    try {
      this.logger.log(
        `Queued webhook for campaign ${campaignId} with data ${JSON.stringify(
          data,
        )}`,
      );
      const job = await this.webhookQueue.add(
        { campaignId, data },
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
        `Queued webhook job ${job.id} for campaign ${campaignId}`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to queue webhook for campaign ${campaignId}`,
        error.stack,
      );
      throw error;
    }
  }
}
