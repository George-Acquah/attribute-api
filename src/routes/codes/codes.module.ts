import { Module } from '@nestjs/common';
import { CodesService } from './codes.service';
import { CodesController } from './codes.controller';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { UsersModule } from '../users/users.module';
import { CaslAbilityFactory } from 'src/shared/providers/casl.provider';

@Module({
  imports: [UsersModule],
  controllers: [CodesController],
  providers: [CodesService, PaginationService, CaslAbilityFactory],
})
export class CodesModule {}
