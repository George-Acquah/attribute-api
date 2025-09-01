import Redis from 'ioredis';
import { RedisClient, IRedisConfig } from '../interfaces/redis.interface';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { ConfigService } from '@nestjs/config/dist/config.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<RedisClient> => {
    const redisUrl = configService.get<string>('REDIS_URL');

    if (redisUrl) {
      const redis = new Redis(redisUrl);
      await verifyRedisConnection(redis);
      return redis;
    }

    const redisConfig: IRedisConfig = {
      host: configService.get<string>('REDIS_HOST', 'redis'),
      port: configService.get<number>('REDIS_PORT', 6379),
      ...(configService.get('REDIS_PASSWORD') && {
        password: configService.get<string>('REDIS_PASSWORD'),
      }),
      ...(configService.get('REDIS_DB') && {
        db: configService.get<number>('REDIS_DB'),
      }),
      ...(configService.get('REDIS_TLS') === 'true' && { tls: {} }),
    };

    const redis = new Redis(redisConfig);
    await verifyRedisConnection(redis);
    return redis;
  },
};

async function verifyRedisConnection(redis: Redis): Promise<void> {
  try {
    await redis.ping();
  } catch (error) {
    throw new Error(`Redis connection failed: ${error.message}`);
  }
}
