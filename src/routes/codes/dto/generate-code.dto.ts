import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class GenerateCodeDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  count?: number;
}
