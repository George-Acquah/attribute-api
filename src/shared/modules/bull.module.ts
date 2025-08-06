import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { REPORT_QUEUE } from '../constants/bull.constants';
import { ReportProcessor } from '../processors/report.processor';
import { BullService } from '../services/bull/bull.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: REPORT_QUEUE,
    }),
  ],
  providers: [BullService, ReportProcessor],
  exports: [BullService],
})
export class BullQueueModule {}
