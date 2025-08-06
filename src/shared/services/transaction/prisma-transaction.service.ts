// src/common/services/transaction.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaTransactionService {
  private readonly logger = new Logger(PrismaTransactionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs a callback inside a database transaction.
   * Rolls back automatically on any error.
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
   * Map raw Prisma errors to custom error types if needed
   */
  private mapError(err: any): Error {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      switch (err.code) {
        case 'P2002': // Unique constraint
          return new Error('Duplicate entry detected');
        case 'P2025': // Not found
          return new Error('Record to update/delete does not exist');
        default:
          return new Error(`Database error: ${err.message}`);
      }
    }

    if (err instanceof Prisma.PrismaClientUnknownRequestError) {
      return new Error('Unknown database error occurred');
    }

    return err; // Rethrow other errors
  }
}
