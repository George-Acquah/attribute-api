import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { CaslAbilityFactory } from 'src/shared/providers/casl.provider';
import { AuditService } from 'src/shared/services/common/audit.service';
import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';

@Module({
  controllers: [RoleController],
  providers: [
    RoleService,
    PaginationService,
    CaslAbilityFactory,
    AuditService,
    PrismaTransactionService,
  ],
})
export class RoleModule {}
