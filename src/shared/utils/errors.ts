import { InternalServerErrorResponse } from '../res/responses/internal-server-error.response';

export function handleError(
  context: string,
  err: unknown,
  userMessage: string,
) {
  this.logger.error(
    `${context}: ${err instanceof Error ? err.message : String(err)}`,
    err instanceof Error ? err.stack : undefined,
  );
  return new InternalServerErrorResponse(userMessage);
}
