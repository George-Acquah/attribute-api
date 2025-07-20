import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { SwaggerApiResponse } from './swagger-responses.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationParams {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  query?: string;
}

export class MetaDto {
  @ApiProperty()
  total: number;
  @ApiProperty()
  lastPage: number;
  @ApiProperty()
  currentPage: number;
  @ApiProperty()
  perPage: number;
  @ApiProperty({ required: false, nullable: true })
  prev: number | null;
  @ApiProperty({ required: false, nullable: true })
  next: number | null;
}

export class PaginatedDataDto<T> {
  @ApiProperty({ type: [Object] })
  items: T[];

  @ApiProperty({ type: () => MetaDto })
  meta: MetaDto;
}

export class SwaggerPaginatedDto<T> extends SwaggerApiResponse<
  PaginatedDataDto<T>
> {
  @ApiProperty({ type: () => PaginatedDataDto })
  data: PaginatedDataDto<T>;
}
