import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InteractionType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class AttributeInteractionDto {
  @ApiProperty()
  @IsString()
  codeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  userMetadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(InteractionType)
  type?: InteractionType;
}
