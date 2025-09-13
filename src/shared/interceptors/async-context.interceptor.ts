import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import {
  CallHandler,
  NestInterceptor,
} from '@nestjs/common/interfaces/features/nest-interceptor.interface';
import { Observable } from 'rxjs';
import { AsyncContextService } from '../services/context/async-context.service';
import { RequestContext } from '../interfaces/als-request.interface';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { Request } from 'express';

@Injectable()
export class ContextInterceptor implements NestInterceptor {
  constructor(private readonly contextService: AsyncContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();

    // Grab authenticated user/admin after AuthGuard
    const ctx: RequestContext = {
      userId: req.user?.roles?.includes('user') && req.user?.id,
      adminId: req.user?.roles?.includes('admin') && req.user?.id,
      roles: req.user?.roles,
      requestId: (req.headers['x-request-id'] as string) || crypto.randomUUID(),
    };

    return this.contextService.run(ctx, () => next.handle());
  }
}
