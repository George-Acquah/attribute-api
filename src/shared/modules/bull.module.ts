import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import {
  MAX_CONCURRENT_PDF_JOBS,
  REPORT_QUEUE,
} from '../constants/bull.constants';
import { ReportProcessor } from '../processors/report.processor';
import { BullService } from '../services/bull/bull.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: REPORT_QUEUE,
      limiter: {
        max: MAX_CONCURRENT_PDF_JOBS,
        duration: 1000,
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
  ],
  providers: [BullService, ReportProcessor],
  exports: [BullService],
})
export class BullQueueModule {}
