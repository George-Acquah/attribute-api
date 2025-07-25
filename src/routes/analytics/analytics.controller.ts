import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':id/top-codes')
  getTopCodes(@Param('id') id: string) {
    return this.analyticsService.getTopCodes(id);
  }

  @Get(':id/conversions/timeline')
  getTimeline(
    @Param('id') id: string,
    @Query('interval') interval: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.analyticsService.getConversionTimeline(id, interval);
  }
}
