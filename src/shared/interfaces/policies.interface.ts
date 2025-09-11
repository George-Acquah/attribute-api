import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { AppAbility } from './casl.interfac';

export interface IPolicyHandler {
  handle(ability: AppAbility, context: ExecutionContext): boolean;
}

export type PolicyHandler =
  | IPolicyHandler
  | ((ability: AppAbility, context: ExecutionContext) => boolean);

export function execPolicyHandler(
  handler: PolicyHandler,
  ability: AppAbility,
  context: ExecutionContext,
) {
  if (typeof handler === 'function') {
    return handler(ability, context);
  }
  return handler.handle(ability, context);
}
