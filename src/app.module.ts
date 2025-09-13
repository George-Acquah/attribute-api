import { AuthModule } from './routes/auth/auth.module';
import { FirebaseAdminModule } from './shared/modules/firebase-admin.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/modules/prisma.module';
import { RedisModule } from './shared/modules/redis.module';
import { RedisController } from './routes/redis/redis.controller';
import { CampaignModule } from './routes/campaign/campaign.module';
import { UsersModule } from './routes/users/users.module';
import { CodesModule } from './routes/codes/codes.module';
import { InteractionModule } from './routes/interaction/interaction.module';
import { ConversionModule } from './routes/conversion/conversion.module';
import { AttributionModule } from './routes/attribution/attribution.module';
import { AnalyticsModule } from './routes/analytics/analytics.module';
import { ReportModule } from './routes/report/report.module';
import { SessionProviderModule } from './shared/modules/session.module';
import { PermissionsModule } from './routes/permissions/permissions.module';
import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { ThrottleModule } from './shared/modules/throttle.module';
import { AlsModule } from './shared/modules/als.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ContextInterceptor } from './shared/interceptors/async-context.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseAdminModule,
    SessionProviderModule,
    AlsModule,
    PrismaModule,
    RedisModule,
    ThrottleModule,
    AuthModule,
    CampaignModule,
    UsersModule,
    CodesModule,
    InteractionModule,
    ConversionModule,
    AttributionModule,
    AnalyticsModule,
    ReportModule,
    PermissionsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ContextInterceptor,
    },
  ],
  controllers: [RedisController],
})
export class AppModule {}
