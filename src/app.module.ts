import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseAdminModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    CampaignModule,
    UsersModule,
    CodesModule,
    InteractionModule,
    ConversionModule,
    AttributionModule,
    AnalyticsModule,
    ReportModule,
  ],
  providers: [],
  controllers: [RedisController],
})
export class AppModule {}
