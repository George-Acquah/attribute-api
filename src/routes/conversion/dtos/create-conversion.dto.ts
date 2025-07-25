// dto/create-conversion.dto.ts
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ConversionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversionDto {
  @ApiProperty({
    default: ConversionType.CUSTOM,
    enum: ConversionType,
  })
  @IsNotEmpty()
  @IsEnum(ConversionType)
  type: ConversionType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  fingerprint?: string;
}
