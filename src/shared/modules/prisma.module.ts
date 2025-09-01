import { PrismaService } from '../services/prisma/prisma.service';
import { PrismaTransactionService } from '../services/transaction/prisma-transaction.service';
import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { Global } from '@nestjs/common/decorators/modules/global.decorator';

@Global()
@Module({
  providers: [PrismaService, PrismaTransactionService],
  exports: [PrismaService, PrismaTransactionService],
})
export class PrismaModule {}
