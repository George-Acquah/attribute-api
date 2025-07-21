import { Injectable, Logger } from '@nestjs/common';
import { NotFoundResponse, OkResponse } from 'src/shared/res/api.response';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';

@Injectable()
export class InteractionService {
  private logger = new Logger(InteractionService.name);
  constructor(private readonly prisma: PrismaService) {}

  async trackInteraction({
    code,
    userId,
    metadata,
  }: {
    code: string;
    userId?: string;
    metadata?: any;
  }) {
    try {
      const codeEntity = await this.prisma.code.findUnique({
        where: { code },
      });

      if (!codeEntity) {
        return new NotFoundResponse('Code not found');
      }

      await this.prisma.interaction.create({
        data: {
          codeId: codeEntity.id,
          userId: userId ?? undefined,
          type: 'SCAN',
          metadata,
        },
      });

      return new OkResponse(true, 'Interaction tracked.');
    } catch (error) {
      this.logger.error('Error In Track Interaction: ', error);
    }
  }
}
