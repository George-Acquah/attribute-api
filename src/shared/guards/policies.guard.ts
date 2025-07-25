import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../providers/casl.provider';
import {
  CHECK_POLICIES_KEY,
  PolicyHandler,
} from '../decorators/policies.decorator';
import { Request } from 'express';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPolicies =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    if (!requiredPolicies) {
      return true; // If no policies are required, allow access
    }

    const { user } = context.switchToHttp().getRequest() as Request;

    const ability = this.caslAbilityFactory.createForUser(user);

    const policyHandlers = requiredPolicies.map((policy) => policy(ability));

    // If any policy check fails, deny access
    if (policyHandlers.some((can) => !can)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
