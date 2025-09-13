import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';
import { Code, Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';
import { _IGenerateCode } from 'src/shared/interfaces/codes.interface';
import { _IPaginationParams } from 'src/shared/interfaces/pagination.interface';
import {
  NotFoundResponse,
  ForbiddenResponse,
  OkResponse,
  InternalServerErrorResponse,
} from 'src/shared/res/responses';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { AsyncContextService } from 'src/shared/services/context/async-context.service';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { RedisService } from 'src/shared/services/redis/redis.service';
import { generateQrDataUrl } from 'src/shared/utils/codes';

@Injectable()
export class CodesService {
  private readonly logger = new Logger(CodesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly paginationService: PaginationService,
    private readonly context: AsyncContextService,
  ) {}

  async generateCodesForCampaign(
    campaignId: string,
    dto: _IGenerateCode,
    key: string,
  ) {
    try {
      const userId = this.context.get('user')?.id;
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId, deletedAt: null },
      });
      if (!campaign) return new NotFoundResponse('Campaign not found');
      if (campaign.ownerId !== userId) return new ForbiddenResponse();

      const codes = [];

      for (let i = 0; i < dto.count; i++) {
        const codeValue = nanoid(8);
        const qrUrl = await generateQrDataUrl(codeValue);

        const code = await this.prisma.code.create({
          data: {
            code: codeValue,
            qrUrl,
            campaignId,
          },
        });

        codes.push(code);
      }

      await this.redis.delByPattern(`${key}:list:*`);

      return new OkResponse(
        codes,
        `${dto.count} QR codes created successfully.`,
      );
    } catch (error) {
      this.logger.error(error);
      return new InternalServerErrorResponse();
    }
  }

  async getCodeById(id: string) {
    try {
      const code = await this.prisma.code.findUnique({
        where: { id, deletedAt: null },
        include: { campaign: true },
      });

      if (!code) return new NotFoundResponse('Code not found');

      return new OkResponse(code, 'Code retrieved');
    } catch (error) {
      this.logger.error(error);
      return new InternalServerErrorResponse();
    }
  }

  async getCodesByCampaignId(campaignId: string, dto: _IPaginationParams) {
    return await this.paginationService.paginateAndFilter<
      Code,
      Prisma.CodeWhereInput,
      Prisma.CodeInclude,
      Prisma.CodeOrderByWithRelationInput
    >(this.prisma.code, {
      ...dto,
      searchFields: ['code', 'campaign'],
      searchValue: dto.query,
      where: { campaignId, deletedAt: null },
      // where: { isActive: true },
      include: {
        campaign: {
          select: {
            name: true,
            medium: true,
            id: true,
          },
        },
        interactions: {
          select: {
            id: true,
            type: true,
            timestamp: true,
          },
        },
      },
    });
  }

  async softDeleteCode(id: string, path: string) {
    try {
      const code = await this.prisma.code.findUnique({
        where: { id, deletedAt: null },
      });

      if (!code || code.deletedAt) {
        return new NotFoundResponse('Code not found or already deleted');
      }

      const result = await this.prisma.code.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await this.redis.delByPattern(`${path}:*`);

      return new OkResponse(result, 'Code deleted (soft) successfully');
    } catch (error) {
      this.logger.error(error);
      return new InternalServerErrorResponse();
    }
  }
}
