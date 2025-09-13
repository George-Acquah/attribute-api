import { IsOptional, IsString } from 'class-validator';

export class FindRegionsFilterDto {
  @IsOptional()
  @IsString()
  countryId?: string;
  @IsOptional()
  @IsString()
  countryCode?: string;
  @IsOptional()
  @IsString()
  countryName?: string;
  @IsOptional()
  @IsString()
  query?: string; // for region name
}
