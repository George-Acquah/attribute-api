import { Logger } from '@nestjs/common/services/logger.service';
import { InternalServerErrorResponse } from '../res/responses/internal-server-error.response';

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
  return new InternalServerErrorResponse(userMessage);
}
