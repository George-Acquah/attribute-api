import { Injectable, Logger, Inject } from '@nestjs/common';
import { RedisClient } from 'src/shared/interfaces/redis.interface';
import { REDIS_CLIENT } from 'src/shared/providers/redis.provider';

@Injectable()
export class RedisService {
  private logger = new Logger(RedisService.name);
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClient,
  ) {}

  async set(key: string, value: any, ttlSeconds?: number) {
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.redisClient.set(key, data, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, data);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data as unknown as T;
    }
  }

  async del(key: string) {
    await this.redisClient.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.redisClient.keys(pattern);
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
      this.logger.log(`Deleted ${keys.length} Redis keys matching: ${pattern}`);
    } else {
      this.logger.log(`No Redis keys matched pattern: ${pattern}`);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redisClient.keys(pattern);
  }

  async flushAll(): Promise<void> {
    await this.redisClient.flushall();
  }

  async publish(channel: string, message: any): Promise<void> {
    const stringMessage =
      typeof message === 'string' ? message : JSON.stringify(message);
    await this.redisClient.publish(channel, stringMessage);
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    const subscriber = this.redisClient.duplicate();
    await subscriber.subscribe(channel);
    subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        try {
          callback(JSON.parse(msg));
        } catch (e) {
          callback(msg);
        }
      }
    });
  }

  async ping(): Promise<string> {
    return this.redisClient.ping();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.ping();
      return true;
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return false;
    }
  }
}
