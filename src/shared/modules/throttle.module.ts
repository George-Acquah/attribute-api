import { Global } from '@nestjs/common/decorators/modules/global.decorator';
import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { ThrottlerModule, ThrottlerStorageService } from '@nestjs/throttler';
import { RedisModule } from './redis.module';
import { RedisThrottlerStorage } from '../throttler/redis-throttler-storage';
import { APP_GUARD } from '@nestjs/core/constants';
import { CustomThrottlerGuard } from '../guards/throttler.guard';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    RedisModule, // import your custom redis service
  ],
  providers: [
    RedisThrottlerStorage,
    {
      provide: ThrottlerStorageService,
      useExisting: RedisThrottlerStorage,
    },
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
  exports: [ThrottlerModule],
})
export class ThrottleModule {}
