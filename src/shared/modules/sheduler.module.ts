import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportModule } from 'src/routes/report/report.module';

@Module({
  imports: [ScheduleModule.forRoot(), ReportModule],
  providers: [],
})
export class SchedulerModule {}
