import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../providers/casl.provider';
import {
  CHECK_POLICIES_KEY,
  PolicyHandler,
} from '../decorators/policies.decorator';
import { Request } from 'express';
import { User } from '@prisma/client';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    const { user } = context.switchToHttp().getRequest() as Request;

    const ability = this.caslAbilityFactory.createForUser(
      user as unknown as User,
    );

    return handlers.every((handler) => handler(ability));
  }
}
