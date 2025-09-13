import { CanActivate } from '@nestjs/common/interfaces/features/can-activate.interface';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { Request } from 'express';
import { Logger } from '@nestjs/common/services/logger.service';
import { SessionVerifierService } from '../services/common/session-verifier.service';
import { Reflector } from '@nestjs/core/services/reflector.service';
import {
  SESSION_GUARD_KEY,
  SESSION_ROLE_KEY,
} from '../decorators/session.decorator';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  private logger = new Logger(SessionAuthGuard.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionVerifier: SessionVerifierService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const role = this.reflector.getAllAndOverride<string>(SESSION_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const guardType = this.reflector.getAllAndOverride<'local' | 'auth'>(
      SESSION_GUARD_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<Request>();

    try {
      const user = await this.sessionVerifier.verifyUserFromRequest(
        request,
        guardType,
      );

      // Attach user to request
      request.user = {
        id: user?.id,
        email: user?.email,
        roles: user?.roles,
      };

      return role === 'admin' ? user.roles.includes('admin') : true;
    } catch (error) {
      this.logger.error('AuthGuard failed:', error.message || error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
