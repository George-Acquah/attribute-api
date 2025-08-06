import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import {
  REPORT_QUEUE,
  GENERATE_PDF_JOB,
} from 'src/shared/constants/bull.constants';

@Injectable()
export class BullService {
  constructor(@InjectQueue(REPORT_QUEUE) private readonly reportQueue: Queue) {}

  async queuePDFGeneration(campaignId: string) {
    await this.reportQueue.add(GENERATE_PDF_JOB, { campaignId });
  }
}
