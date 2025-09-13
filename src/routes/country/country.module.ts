import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { CaslAbilityFactory } from 'src/shared/providers/casl.provider';
// import { AuditService } from 'src/shared/services/common/audit.service';
import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';
import { CountryService } from './country.service';
import { CountryController } from './country.controller';

@Module({
  controllers: [CountryController],
  providers: [
    CountryService,
    CaslAbilityFactory,
    // AuditService,
    PrismaTransactionService,
  ],
})
export class CountryModule {}
