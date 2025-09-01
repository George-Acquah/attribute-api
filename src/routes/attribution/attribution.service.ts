import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';
import { Prisma } from '@prisma/client';
import { IAttributeInteraction } from 'src/shared/interfaces/attribution.interface';
import { BadRequestResponse, OkResponse } from 'src/shared/res/responses';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { handleError } from 'src/shared/utils/errors';

@Injectable()
export class AttributionService {
  private logger = new Logger(AttributionService.name);
  constructor(private readonly prisma: PrismaService) {}

  async attributeConversion(
    conversionId: string,
    userId?: string,
    fingerprint?: string,
    attributionAlgorithm: 'first-touch' | 'others' = 'first-touch',
  ) {
    try {
      this.logger.log('fingerprint: ', fingerprint);
      const interactionWhere: Prisma.InteractionWhereInput = userId
        ? { userId }
        : fingerprint
        ? { fingerprint }
        : null;

      let interactionOrderBy: Prisma.InteractionOrderByWithRelationInput;
      let takeInteraction: number;
      switch (attributionAlgorithm) {
        case 'first-touch':
          interactionOrderBy = { timestamp: 'asc' };
          takeInteraction = 1;
          break;
        default:
          interactionOrderBy = { timestamp: 'desc' };
          takeInteraction = 3;
          break;
      }

      if (interactionWhere) {
        const interactions = await this.prisma.interaction.findMany({
          where: interactionWhere,
          orderBy: interactionOrderBy,
          take: takeInteraction,
        });

        if (!interactions.length) {
          this.logger.warn(
            `No interactions found for conversion ${conversionId}`,
          );
          throw new Error();
        }

        // – Link interactions
        await this.prisma.conversionInteraction.createMany({
          data: interactions.map((i) => ({
            conversionId,
            interactionId: i.id,
          })),
          skipDuplicates: true,
        });

        this.logger.log(
          `Conversion ${conversionId} attributed to interactions ${interactions.map(
            (i) => i.id,
          )}`,
        );
      }

      this.logger.log(`Conversion ${conversionId} attributed to interaction`);
    } catch (error) {
      this.logger.error('Error in attributeConversion', error);
      throw error;
    }
  }

  async attributeInteraction(
    interactionId: string,
    fingerprint: string,
    dto: IAttributeInteraction,
  ) {
    try {
      if (!interactionId || !dto.codeId) {
        return new BadRequestResponse(
          'Please make sure both interaction id and code id are present to attribute an interaction.',
        );
      }

      const interaction = await this.prisma.interaction.findUnique({
        where: { id: interactionId, codeId: dto.codeId, fingerprint },
      });

      if (!interaction) {
        return new BadRequestResponse(
          `Interaction with id ${interactionId} and code ${dto.codeId} not found.`,
        );
      }

      // Check if the interaction is already attributed
      if (
        interaction.email ||
        interaction.phoneNumber ||
        interaction.userMetadata
      ) {
        return new BadRequestResponse(
          `Interaction with id ${interactionId} and code ${dto.codeId} is already attributed.`,
        );
      }

      // Update the interaction with the codeId
      const updatedInteraction = await this.prisma.interaction.update({
        where: { id: interactionId },
        data: {
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          userMetadata: dto.userMetadata as Prisma.InputJsonValue,
          type: dto.type,
        },
      });

      this.logger.log(
        `Interaction ${interactionId} attributed with code ${dto.codeId}`,
      );

      return new OkResponse(
        updatedInteraction,
        `Interaction attributed successfully.`,
      );
    } catch (err) {
      return handleError(
        `attributeInteraction`,
        err,
        `Error in attributeInteraction for interaction ${interactionId} and code ${dto.codeId}`,
      );
    }
  }
}
