import { Injectable, Logger } from '@nestjs/common';
import { _ICreateConversion } from 'src/shared/interfaces/conversion.interface';
import {
  OkResponse,
  InternalServerErrorResponse,
  BadRequestResponse,
  NotFoundResponse,
} from 'src/shared/res/api.response';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { AttributionService } from '../attribution/attribution.service';
import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConversionService {
  private logger = new Logger(ConversionService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly attributionService: AttributionService,
    private readonly transaction: PrismaTransactionService,
  ) {}

  async createConversion({
    type,
    value,
    fingerprint,
    userId,
  }: _ICreateConversion) {
    if (!fingerprint) return new BadRequestResponse();

    try {
      const result = await this.transaction.run(async (tx) => {
        // 1. Create conversion
        const conversion = await tx.conversion.create({
          data: {
            type,
            value,
            userId,
            fingerprint,
          },
        });

        this.logger.log('Conversion created:', conversion);

        // 2. Attribute conversion inside transaction
        const interactionWhere: Prisma.InteractionWhereInput = userId
          ? { userId }
          : { fingerprint };

        const interactions = await tx.interaction.findMany({
          where: interactionWhere,
          orderBy: { timestamp: 'desc' },
          take: 3,
        });

        if (!interactions.length)
          return new NotFoundResponse('No recent interactions to attribute');

        await tx.conversionInteraction.createMany({
          data: interactions.map((i) => ({
            conversionId: conversion.id,
            interactionId: i.id,
          })),
          skipDuplicates: true,
        });

        this.logger.log(
          `Conversion ${conversion.id} attributed to ${interactions.length} interactions.`,
        );

        return conversion;
      });

      return new OkResponse(result, 'Conversion created.');
    } catch (err) {
      this.logger.error('Transaction failed in createConversion', err);
      return new InternalServerErrorResponse('Failed to create conversion');
    }
  }
}
