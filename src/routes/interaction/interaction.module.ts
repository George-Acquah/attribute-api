import { Module } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { InteractionController } from './interaction.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [InteractionController],
  providers: [InteractionService],
})
export class InteractionModule {}
