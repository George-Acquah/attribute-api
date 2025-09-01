import { RedisProvider } from '../providers/redis.provider';
import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { Global } from '@nestjs/common/decorators/modules/global.decorator';
import { RedisService } from '../services/redis/redis.service';

@Global()
@Module({
  providers: [RedisService, RedisProvider],
  exports: [RedisService],
})
export class RedisModule {}
