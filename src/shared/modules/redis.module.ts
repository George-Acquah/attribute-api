import { Global, Module } from '@nestjs/common';
import { RedisService } from '../services/redis/redis.service';
import { RedisProvider } from '../providers/redis.provider';

@Global()
@Module({
  providers: [RedisService, RedisProvider],
  exports: [RedisService],
})
export class RedisModule {}
