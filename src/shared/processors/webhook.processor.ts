import { WEBHOOK_QUEUE } from '../constants/bull.constants';
import axios from 'axios';
import { Logger } from '@nestjs/common/services/logger.service';
import { Job } from 'bull';
import { Processor } from '@nestjs/bull/dist/decorators/processor.decorator';

@Processor(WEBHOOK_QUEUE)
export class WebhookProcessor {
  private readonly logger = new Logger(WebhookProcessor.name);
  async handleWebhook(job: Job<{ campaignId: string; data: any }>) {
    this.logger.log(`Processing webhook for campaign ${job.data.campaignId}`);
    this.logger.log(`Webhook data: ${JSON.stringify(job.data.data)}`);
    try {
      const result = await axios.post(job.data.campaignId, job.data.data);

      this.logger.log(
        `Webhook processed successfully for campaign ${job.data.campaignId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process webhook for campaign ${job.data.campaignId}`,
        error,
      );
      throw error;
    }
  }
}
