import { InteractionService } from './interaction.service';
import { InteractionController } from './interaction.controller';
import { UsersModule } from '../users/users.module';
import { fingerprintMiddleware } from 'src/shared/middlewares/fingerprint.middleware';
import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { NestModule } from '@nestjs/common/interfaces/modules/nest-module.interface';
import { MiddlewareConsumer } from '@nestjs/common/interfaces/middleware/middleware-consumer.interface';
import { RequestMethod } from '@nestjs/common/enums/request-method.enum';

@Module({
  imports: [UsersModule],
  controllers: [InteractionController],
  providers: [InteractionService],
})
export class InteractionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(fingerprintMiddleware).forRoutes({
      path: 'interaction/:code',
      method: RequestMethod.GET,
    });
  }
}
