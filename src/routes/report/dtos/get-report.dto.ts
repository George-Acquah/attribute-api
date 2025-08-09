import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationWithDatesParams } from 'src/shared/dtos/pagination.dto';
import { ReportStatus } from 'src/shared/enums/reports.enums';

export class GetLogsDto extends PaginationWithDatesParams {
  @ApiPropertyOptional({
    description: 'Filter by campaign ID',
    example: 'camp_123456789',
  })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({
    description: 'Filter by report status',
    enum: ReportStatus,
    example: ReportStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
