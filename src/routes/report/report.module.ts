import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { BullQueueModule } from 'src/shared/modules/bull.module';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { forwardRef } from '@nestjs/common/utils/forward-ref.util';

@Module({
  imports: [forwardRef(() => BullQueueModule)],
  controllers: [ReportController],
  providers: [ReportService, PaginationService],
  exports: [ReportService],
})
export class ReportModule {}
