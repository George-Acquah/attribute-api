import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common/exceptions';

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
    foreignKeys?: string,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        return await callback(tx);
      });
    } catch (err) {
      throw this.mapError(err, foreignKeys);
    }
  }
  /**
   * Map Prisma errors to application-specific errors
   * @param err The error thrown by Prisma
   */
  private mapError(err: any, foreignKeys?: string): Error {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      switch (err.code) {
        case 'P2002':
          return new ConflictException('Duplicate entry detected');
        case 'P2003':
          return new BadRequestException(
            `Foreign key constraint failed on the field: ${
              foreignKeys || 'unknown'
            }`,
          );
        case 'P2025':
          return new NotFoundException(
            'Record to update/delete does not exist',
          );
        default:
          return new InternalServerErrorException(
            `Prisma error: ${err.message}`,
          );
      }
    }

    if (err instanceof Prisma.PrismaClientUnknownRequestError) {
      return new InternalServerErrorException(
        'Unknown database error occurred',
      );
    }

    if (err instanceof HttpException) {
      return err;
    }

    return new InternalServerErrorException(err?.message ?? 'Unexpected error');
  }
}
