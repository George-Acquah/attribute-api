import { _ICreateConversion } from 'src/shared/interfaces/conversion.interface';

import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { AttributionService } from '../attribution/attribution.service';
import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';
import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';
import { BadRequestResponse, OkResponse } from 'src/shared/res/responses';
import { NotFoundException } from '@nestjs/common';
import { handleError } from 'src/shared/utils/errors';
import { AsyncContextService } from 'src/shared/services/context/async-context.service';

@Injectable()
export class ConversionService {
  private logger = new Logger(ConversionService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly attributionService: AttributionService,
    private readonly context: AsyncContextService,
    private readonly transaction: PrismaTransactionService,
  ) {}

  async createConversion(
    { type, value }: _ICreateConversion,
    fingerprint: string,
  ) {
    if (!fingerprint) return new BadRequestResponse();
    const userId = this.context.get('user')?.id || null;

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
          throw new NotFoundException('No recent interactions to attribute');

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
      return handleError(
        'ConversionService.createConversion',
        err,
        'Failed to create conversion',
        this.logger,
      );
    }
  }
}
