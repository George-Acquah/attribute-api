import { ThrottlerStorageService } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { RedisService } from '../services';

@Injectable()
export class RedisThrottlerStorage extends ThrottlerStorageService {
  constructor(private readonly redis: RedisService) {
    super();
  }

  private getKey(key: string) {
    return `throttle:${key}`;
  }

  async getRecord(key: string): Promise<number[] | undefined> {
    const redisKey = this.getKey(key);
    const data = await this.redis.get<string>(redisKey);
    if (!data) return undefined;
    try {
      return JSON.parse(data) as number[];
    } catch {
      return undefined;
    }
  }

  async addRecord(key: string, ttl: number): Promise<void> {
    const redisKey = this.getKey(key);
    const now = Date.now();

    const record = await this.getRecord(key);
    const filtered = (record || []).filter(
      (timestamp) => timestamp > now - ttl * 1000,
    );
    filtered.push(now);

    await this.redis.set(redisKey, JSON.stringify(filtered), ttl);
  }
}

// export const REDIS_THROTTLER_STORAGE = 'REDIS_THROTTLER_STORAGE';
