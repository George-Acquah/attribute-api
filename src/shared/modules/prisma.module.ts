import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../services/prisma/prisma.service';
import { PrismaTransactionService } from '../services/transaction/prisma-transaction.service';

@Global()
@Module({
  providers: [PrismaService, PrismaTransactionService],
  exports: [PrismaService, PrismaTransactionService],
})
export class PrismaModule {}
