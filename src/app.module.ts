import { Module } from '@nestjs/common';
import { AuthModule } from './routes/auth/auth.module';
import { FirebaseAdminModule } from './shared/modules/firebase-admin.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/modules/prisma.module';
import { RedisModule } from './shared/modules/redis.module';
import { RedisController } from './routes/redis/redis.controller';
import { CampaignModule } from './routes/campaign/campaign.module';
import { UsersModule } from './routes/users/users.module';
import { AttributesModule } from './routes/attributes/attributes.module';
import { CodesModule } from './routes/codes/codes.module';
import { InteractionModule } from './routes/interaction/interaction.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseAdminModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    CampaignModule,
    UsersModule,
    AttributesModule,
    CodesModule,
    InteractionModule,
  ],
  providers: [],
  controllers: [RedisController],
})
export class AppModule {}
