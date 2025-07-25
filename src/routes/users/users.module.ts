import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { CaslAbilityFactory } from 'src/shared/providers/casl.provider';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PaginationService, CaslAbilityFactory],
  exports: [UsersService],
})
export class UsersModule {}
