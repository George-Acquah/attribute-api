import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { CaslAbilityFactory } from 'src/shared/providers/casl.provider';
import { AuditService } from 'src/shared/services/common/audit.service';
import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';

@Module({
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
    PaginationService,
    CaslAbilityFactory,
    AuditService,
    PrismaTransactionService,
  ],
  exports: [PermissionsService],
})
export class PermissionsModule {}
