import {
  SwaggerOkResponse,
  SwaggerCreatedResponse,
  SwaggerBadRequestResponse,
  SwaggerNotFoundResponse,
  SwaggerForbiddenResponse,
  SwaggerInternalServerErrorResponse,
} from '../dtos/swagger-responses.dto';
import { MetaDto, SwaggerPaginatedDto } from '../dtos/pagination.dto';
import { applyDecorators } from '@nestjs/common/decorators/core/apply-decorators';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { Type } from '@nestjs/common/interfaces/type.interface';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { ApiExtraModels } from '@nestjs/swagger/dist/decorators/api-extra-models.decorator';
import { getSchemaPath } from '@nestjs/swagger/dist/utils/get-schema-path.util';

export function ApiGlobalResponses() {
  return applyDecorators(
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Bad Request',
      type: SwaggerBadRequestResponse,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Resource Not Found',
      type: SwaggerNotFoundResponse,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Access Denied',
      type: SwaggerForbiddenResponse,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal Server Error',
      type: SwaggerInternalServerErrorResponse,
    }),
  );
}

export const ApiCreatedResponseWithModel = <TModel extends Type<unknown>>(
  model: TModel,
) =>
  applyDecorators(
    ApiExtraModels(SwaggerCreatedResponse, model),
    ApiCreatedResponse({
      description: `Created Response Of ${model.name}`,
      schema: {
        title: `Created Response Of ${model.name}`,
        allOf: [
          { $ref: getSchemaPath(SwaggerCreatedResponse) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );

export const ApiOkResponseWithModel = <TModel extends Type<unknown>>(
  model: TModel,
) =>
  applyDecorators(
    ApiExtraModels(SwaggerOkResponse, model),
    ApiOkResponse({
      description: `Result Response Of ${model.name}`,
      schema: {
        title: `Result Response Of ${model.name}`,
        allOf: [
          { $ref: getSchemaPath(SwaggerOkResponse) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );

export const ApiPaginatedResponse = <TModel extends Type<unknown>>(
  model: TModel,
) =>
  applyDecorators(
    ApiExtraModels(SwaggerPaginatedDto, model),
    ApiOkResponse({
      description: `Paginated Response Of ${model.name}`,
      schema: {
        title: `Paginated Response Of ${model.name}`,

        allOf: [
          { $ref: getSchemaPath(SwaggerPaginatedDto) },
          {
            properties: {
              data: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  },
                  meta: { $ref: getSchemaPath(MetaDto) },
                },
              },
            },
          },
        ],
      },
    }),
  );
