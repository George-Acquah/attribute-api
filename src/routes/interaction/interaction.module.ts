import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { InteractionController } from './interaction.controller';
import { UsersModule } from '../users/users.module';
import { fingerprintMiddleware } from 'src/shared/middlewares/fingerprint.middleware';

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
