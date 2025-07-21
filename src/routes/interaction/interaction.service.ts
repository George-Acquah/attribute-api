import { Injectable, Logger } from '@nestjs/common';
import { _IFingerprintWithMeta } from 'src/shared/interfaces/interactions.interface';
import {
  InternalServerErrorResponse,
  NotFoundResponse,
  OkResponse,
} from 'src/shared/res/api.response';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';

@Injectable()
export class InteractionService {
  private logger = new Logger(InteractionService.name);
  constructor(private readonly prisma: PrismaService) {}

  async trackInteraction({
    code,
    userId,
    fingerprintWithMeta: { fingerprint, metadata },
  }: {
    code: string;
    userId?: string;
    fingerprintWithMeta?: _IFingerprintWithMeta;
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

          fingerprint,
          type: 'SCAN',
          metadata,
        },
      });

      return new OkResponse(true, 'Interaction tracked.');
    } catch (error) {
      this.logger.error('Error In Track Interaction: ', error);

      return new InternalServerErrorResponse();
    }
  }
}
