import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { CaslAbilityFactory } from 'src/shared/providers/casl.provider';

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService, PaginationService, CaslAbilityFactory],
  exports: [PermissionsService],
})
export class PermissionsModule {}
