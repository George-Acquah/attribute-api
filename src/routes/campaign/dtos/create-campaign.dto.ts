import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsString()
  channelId: string;

  @IsString()
  regionId: string;

  @IsString()
  medium: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  budget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numberOfCodes?: number;
}
