import { SetMetadata } from '@nestjs/common/decorators/core/set-metadata.decorator';
import { AppAbility } from '../providers/casl.provider';

export type PolicyHandler = (ability: AppAbility) => boolean;

export const CHECK_POLICIES_KEY = 'check_policies';

export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
