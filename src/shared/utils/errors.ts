import { Logger } from '@nestjs/common/services/logger.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common/exceptions';
import {
  BadRequestResponse,
  NotFoundResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  ConflictResponse,
} from '../res/responses';

export function handleError(
  context: string,
  err: unknown,
  userMessage: string,
  logger: Logger = new Logger(context),
) {
  logger.error(
    `${context}: ${err instanceof Error ? err.message : String(err)}`,
    err instanceof Error ? err.stack : undefined,
  );

  if (err instanceof ConflictException) {
    return new ConflictResponse(err.message);
  }

  if (err instanceof BadRequestException) {
    return new BadRequestResponse(err.message);
  }

  if (err instanceof NotFoundException) {
    return new NotFoundResponse(err.message);
  }

  if (err instanceof ForbiddenException) {
    return new ForbiddenResponse(err.message);
  }

  return new InternalServerErrorResponse(userMessage);
}
