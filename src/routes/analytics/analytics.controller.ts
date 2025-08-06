import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':campaignId/top-codes')
  getTopCodes(@Param('campaignId') campaignId: string) {
    return this.analyticsService.getTopCodes(campaignId);
  }

  @Get(':campaignId/conversions/timeline')
  getTimeline(
    @Param('campaignId') campaignId: string,
    @Query('interval') interval: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.analyticsService.getConversionTimeline(campaignId, interval);
  }
}
