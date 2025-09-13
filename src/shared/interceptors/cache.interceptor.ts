import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import {
  CallHandler,
  NestInterceptor,
} from '@nestjs/common/interfaces/features/nest-interceptor.interface';
import { RedisService } from '../services/redis/redis.service';
import { from, Observable, tap } from 'rxjs';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
} from '../decorators/cacheable.decorator';
import { Reflector } from '@nestjs/core/services/reflector.service';
import { Request } from 'express';
// import { Logger } from '@nestjs/common/services/logger.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  // private logger = new Logger(CacheInterceptor.name);
  constructor(
    private reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const handler = context.getHandler();
    const cacheKeyMeta = this.reflector.get<
      string | ((...args: any[]) => string)
    >(CACHE_KEY_METADATA, handler);
    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, handler) ?? 60;

    const request = context.switchToHttp().getRequest<Request>();

    const args = [
      request.params,
      request.query,
      request.body,
      request.user,
      request.path,
    ];

    const cacheKey =
      typeof cacheKeyMeta === 'function' ? cacheKeyMeta(...args) : cacheKeyMeta;

    if (!cacheKey) return next.handle();

    const cached = await this.redisService.get(cacheKey);

    if (cached) return from([cached]);

    return next.handle().pipe(
      tap((result) => {
        this.redisService.set(cacheKey, result, ttl);
      }),
    );
  }
}
