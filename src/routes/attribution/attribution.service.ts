import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';

@Injectable()
export class AttributionService {
  private logger = new Logger(AttributionService.name);
  constructor(private readonly prisma: PrismaService) {}

  async attributeConversion(
    conversionId: string,
    userId?: string,
    fingerprint?: string,
  ) {
    try {
      this.logger.log('fingerprint: ', fingerprint);
      const interactionWhere: Prisma.InteractionWhereInput = userId
        ? { userId }
        : fingerprint
        ? { fingerprint }
        : null;

      if (interactionWhere) {
        const interactions = await this.prisma.interaction.findMany({
          where: interactionWhere,
          orderBy: { timestamp: 'desc' },
          take: 3,
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
}
