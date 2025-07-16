import { Module } from '@nestjs/common';
import { AuthModule } from './routes/auth/auth.module';
import { FirebaseAdminModule } from './shared/modules/firebase-admin.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/modules/prisma.module';
import { RedisModule } from './shared/modules/redis.module';
import { RedisController } from './routes/redis/redis.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseAdminModule,
    PrismaModule,
    RedisModule,
    AuthModule,
  ],
  providers: [],
  controllers: [RedisController],
})
export class AppModule {}
