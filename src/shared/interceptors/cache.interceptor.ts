import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../services/redis/redis.service';
import { from, Observable, tap } from 'rxjs';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
} from '../decorators/cacheable.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const handler = context.getHandler();
    // eslint-disable-next-line @typescript-eslint/ban-types
    const cacheKeyMeta = this.reflector.get<string | Function>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );
    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, handler) ?? 60;

    const request = context.switchToHttp().getRequest();

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
