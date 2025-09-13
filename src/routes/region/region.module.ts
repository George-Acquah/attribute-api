import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { CaslAbilityFactory } from 'src/shared/providers/casl.provider';
import { AuditService } from 'src/shared/services/common/audit.service';
import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';
import { RegionService } from './region.service';
import { RegionController } from './region.controller';

@Module({
  controllers: [RegionController],
  providers: [
    RegionService,
    CaslAbilityFactory,
    AuditService,
    PrismaTransactionService,
  ],
})
export class RegionModule {}
