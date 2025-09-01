import {
  MAX_CONCURRENT_PDF_JOBS,
  REPORT_QUEUE,
  WEBHOOK_QUEUE,
} from '../constants/bull.constants';
import { ReportProcessor } from '../processors/report.processor';
import { BullService } from '../services/bull/bull.service';
import { ReportModule } from 'src/routes/report/report.module';
import { PaginationService } from '../services/common/pagination.service';
import { WebhookProcessor } from '../processors/webhook.processor';
import { Global } from '@nestjs/common/decorators/modules/global.decorator';
import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { BullModule } from '@nestjs/bull/dist/bull.module';
import { forwardRef } from '@nestjs/common/utils/forward-ref.util';

function getQueueOptions(name: string) {
  const base = {
    name,
    limiter: {
      max: MAX_CONCURRENT_PDF_JOBS,
      duration: 1000,
    },
  };
  const redis =
    process.env.NODE_ENV === 'production'
      ? { redis: process.env.REDIS_URL }
      : {
          redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT, 10) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
          },
        };
  return { ...base, ...redis };
}

@Global()
@Module({
  imports: [
    BullModule.registerQueue(
      getQueueOptions(REPORT_QUEUE),
      getQueueOptions(WEBHOOK_QUEUE),
    ),
    forwardRef(() => ReportModule),
  ],
  providers: [
    BullService,
    ReportProcessor,
    WebhookProcessor,
    PaginationService,
  ],
  exports: [BullService],
})
export class BullQueueModule {}
