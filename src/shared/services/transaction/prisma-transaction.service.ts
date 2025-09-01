import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';

@Injectable()
export class PrismaTransactionService {
  private readonly logger = new Logger(PrismaTransactionService.name);

  constructor(private readonly prisma: PrismaService) {}
  /**
   * Run a Prisma transaction with error handling
   * @param callback Function to execute within the transaction
   */
  async run<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        return await callback(tx);
      });
    } catch (err) {
      this.logger.error('Transaction failed', err);
      throw this.mapError(err);
    }
  }
  /**
   * Map Prisma errors to application-specific errors
   * @param err The error thrown by Prisma
   */
  private mapError(err: any): Error {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      switch (err.code) {
        case 'P2002':
          return new Error('Duplicate entry detected');
        case 'P2025':
          return new Error('Record to update/delete does not exist');
        default:
          return new Error(`Database error: ${err.message}`);
      }
    }

    if (err instanceof Prisma.PrismaClientUnknownRequestError) {
      return new Error('Unknown database error occurred');
    }

    return err;
  }
}
