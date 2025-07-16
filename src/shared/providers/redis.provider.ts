import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisClient, IRedisConfig } from '../interfaces/redis.interface';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (): RedisClient => {
    const redisConfig: IRedisConfig = {
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      ...(process.env.REDIS_PASSWORD && {
        password: process.env.REDIS_PASSWORD,
      }),
      ...(process.env.REDIS_DB && { db: parseInt(process.env.REDIS_DB, 10) }),
      ...(process.env.REDIS_TLS === 'true' && { tls: {} }),
    };

    return new Redis(redisConfig);
  },
};
