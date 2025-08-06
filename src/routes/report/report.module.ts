import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { BullQueueModule } from 'src/shared/modules/bull.module';
import { PaginationService } from 'src/shared/services/common/pagination.service';

@Module({
  imports: [BullQueueModule],
  controllers: [ReportController],
  providers: [ReportService, PaginationService],
})
export class ReportModule {}
