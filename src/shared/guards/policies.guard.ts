import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../providers/casl.provider';
import { Request } from 'express';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { CanActivate } from '@nestjs/common/interfaces/features/can-activate.interface';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { ForbiddenException } from '@nestjs/common/exceptions/forbidden.exception';
import {
  PERMISSION_KEY,
  PermissionMetadata,
} from '../decorators/require-permission.decorator';
import { Logger } from '@nestjs/common/services/logger.service';

@Injectable()
export class PoliciesGuard implements CanActivate {
  private logger = new Logger(PoliciesGuard.name);
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { action, subject } =
      this.reflector.get<PermissionMetadata>(
        PERMISSION_KEY,
        context.getHandler(),
      ) || {};

    // If no permission is specified, allow route by default
    if (!action || !subject) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    const ability = await this.caslAbilityFactory.createForUser(user);

    if (!ability.can(action, subject)) {
      throw new ForbiddenException(
        `You do not have permission to ${action} ${subject}`,
      );
    }
    this.logger.log(
      `App ability rules: ${JSON.stringify(ability.rules, null, 2)}`,
    );

    return true;
  }
}
