import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { CaslAbilityFactory } from 'src/shared/providers/casl.provider';
import { AuditService } from 'src/shared/services/common/audit.service';
import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';

@Module({
  controllers: [ChannelController],
  providers: [
    ChannelService,
    PaginationService,
    CaslAbilityFactory,
    AuditService,
    PrismaTransactionService,
  ],
})
export class ChannelModule {}
