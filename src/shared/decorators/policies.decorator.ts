import { SetMetadata } from '@nestjs/common/decorators/core/set-metadata.decorator';
import { PolicyHandler } from '../interfaces/policies.interface';

export const CHECK_POLICIES_KEY = 'check_policies';

export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
