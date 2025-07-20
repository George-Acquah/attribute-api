import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class CacheService {
  private logger = new Logger(CacheService.name);
  constructor(private readonly redis: RedisService) {}

  async wrap<T>(
    key: string,
    ttl: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.redis.get<T>(key);

    if (cached) return cached;

    const result = await fetcher();

    await this.redis.set(key, result, ttl);
    return result;
  }
}
