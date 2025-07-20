// src/shared/res/swagger-responses.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export class SwaggerApiResponse<T> {
  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.OK,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Response data',
    nullable: true,
  })
  data: T;

  @ApiProperty({
    description: 'Human-readable message',
    required: false,
    nullable: true,
  })
  message?: string;

  @ApiProperty({
    description: 'Error message',
    required: false,
    nullable: true,
  })
  error?: string;
}

export class SwaggerOkResponse<T> extends SwaggerApiResponse<T> {
  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ example: 'OK' })
  message: string;
}

export class SwaggerCreatedResponse<T> extends SwaggerApiResponse<T> {
  @ApiProperty({ example: HttpStatus.CREATED })
  statusCode: number;

  @ApiProperty({ example: 'Created' })
  message: string;
}

export class SwaggerBadRequestResponse extends SwaggerApiResponse<null> {
  @ApiProperty({ example: HttpStatus.BAD_REQUEST })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}

export class SwaggerNotFoundResponse extends SwaggerApiResponse<null> {
  @ApiProperty({ example: HttpStatus.NOT_FOUND })
  statusCode: number;

  @ApiProperty({ example: 'Not Found' })
  error: string;
}

export class SwaggerForbiddenResponse extends SwaggerApiResponse<null> {
  @ApiProperty({ example: HttpStatus.FORBIDDEN })
  statusCode: number;

  @ApiProperty({ example: 'Access Denied' })
  error: string;
}

export class SwaggerInternalServerErrorResponse extends SwaggerApiResponse<null> {
  @ApiProperty({ example: HttpStatus.INTERNAL_SERVER_ERROR })
  statusCode: number;

  @ApiProperty({ example: 'Internal Server Error' })
  error: string;
}
