import { Injectable, Logger } from '@nestjs/common';
import { Campaign, Code, Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';
import { _ICreateCampaign } from 'src/shared/interfaces/campaign.interface';
import { _IPaginationParams } from 'src/shared/interfaces/pagination.interface';
import {
  ApiResponse,
  BadRequestResponse,
  CreatedResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  OkResponse,
} from 'src/shared/res/api.response';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { RedisService } from 'src/shared/services/redis/redis.service';
import { generateQrDataUrl } from 'src/shared/utils/codes';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly redis: RedisService,
  ) {}

  async createCampaign(
    dto: _ICreateCampaign,
    userId: string,
    path: string,
  ): Promise<ApiResponse<Campaign & { codes: Code[] }>> {
    try {
      const campaign = await this.prisma.campaign.create({
        data: {
          name: dto.name,
          medium: dto.medium,
          budget: dto.budget,
          ownerId: userId,
        },
      });

      const codes = await Promise.all(
        Array.from({ length: dto.numberOfCodes ?? 1 }).map(async () => {
          const codeValue = nanoid(8);
          const qrUrl = await generateQrDataUrl(codeValue);
          return this.prisma.code.create({
            data: {
              campaignId: campaign.id,
              code: codeValue,

              qrUrl,
            },
          });
        }),
      );

      await this.redis.delByPattern(`${path}:list:*`);
      await this.redis.delByPattern(`${path}:analytics:*`);

      return new CreatedResponse(
        { ...campaign, codes },
        'Your campaign has been created successfully',
      );
    } catch (error) {
      this.logger.error(error);
      return new InternalServerErrorResponse();
    }
  }

  async findAllCampaigns(dto: _IPaginationParams) {
    this.logger.log('Finding all campaigns');
    return await this.paginationService.paginateAndFilter<
      Campaign,
      Prisma.CampaignWhereInput,
      Prisma.CampaignInclude,
      Prisma.CampaignOrderByWithRelationInput
    >(this.prisma.campaign, {
      ...dto,
      searchFields: ['name'],
      searchValue: dto.query,
      // where: { isActive: true },
      include: { owner: true },
    });
  }

  async findOneCampaign(id: string): Promise<ApiResponse<Campaign>> {
    try {
      this.logger.log(id);
      // TODO
      const campaign = await this.prisma.campaign.findUnique({ where: { id } });
      if (!campaign)
        return new NotFoundResponse('Campaign with this id does not exist');

      return new OkResponse(campaign, 'Campaign found.');
    } catch (error) {
      this.logger.error(error);
      return new InternalServerErrorResponse();
    }
  }

  async updateCampaign(
    id: string,
    dto: Partial<_ICreateCampaign>,
    userId: string,
    path: string,
  ) {
    try {
      const campaign = await this.prisma.campaign.findUnique({ where: { id } });

      if (!campaign)
        return new NotFoundResponse('Campaign with this id does not exist');

      if (campaign.ownerId !== userId) return new ForbiddenResponse();

      const result = await this.prisma.campaign.update({
        where: { id },
        data: dto,
      });

      await this.redis.del(`${path}:list:*`);

      return new OkResponse(result, 'Campaign updated successfully');
    } catch (error) {
      this.logger.error(error);
      return new InternalServerErrorResponse();
    }
  }

  async deleteCampaign(id: string, userId: string, path: string) {
    try {
      const campaign = await this.prisma.campaign.findUnique({ where: { id } });

      if (!campaign)
        return new NotFoundResponse('Campaign with this id does not exist');

      if (campaign.ownerId !== userId) return new ForbiddenResponse();

      const result = await this.prisma.campaign.delete({
        where: { id },
      });

      await this.redis.delByPattern(`${path}:*`);

      return new OkResponse(result, 'Campaign deleted successfully');
    } catch (error) {
      this.logger.error(error);
      return new InternalServerErrorResponse();
    }
  }

  async getAnalytics(campaignId: string, fingerprint: string, userId: string) {
    this.logger.log('Getting analytics for', {
      campaignId,
      fingerprint,
      userId,
    });

    try {
      if (!campaignId || typeof campaignId !== 'string') {
        return new BadRequestResponse('Invalid campaign ID');
      }

      // Fetch all active codes under campaign
      const codes = await this.prisma.code.findMany({
        where: {
          campaignId,
          deletedAt: null,
        },
        select: {
          id: true,
          code: true,
        },
      });

      if (!codes.length) {
        return new OkResponse(
          {
            campaignId,
            totalInteractions: 0,
            totalUniqueInteractions: 0,
            totalConversions: 0,
            totalUniqueConversions: 0,
            conversionRate: 0,
            codes: [],
            topCodes: [],
          },
          'No codes found for this campaign',
        );
      }

      const codeIds = codes.map((c) => c.id);

      // Fetch interactions for all codes
      const interactions = await this.prisma.interaction.findMany({
        where: {
          codeId: { in: codeIds },
        },
        select: {
          id: true,
          codeId: true,
          userId: true,
          fingerprint: true,
          conversionLinks: {
            select: {
              conversion: {
                select: { id: true },
              },
            },
          },
        },
      });

      // Index for aggregating per code
      const statsMap = new Map<
        string,
        {
          code: string;
          interactions: number;
          uniqueUsers: Set<string>;
          conversions: Set<string>;
        }
      >();

      for (const interaction of interactions) {
        const identity = interaction.userId || interaction.fingerprint;
        const codeId = interaction.codeId;
        const codeMeta = statsMap.get(codeId) || {
          code: codes.find((c) => c.id === codeId)?.code ?? '',
          interactions: 0,
          uniqueUsers: new Set<string>(),
          conversions: new Set<string>(),
        };

        codeMeta.interactions += 1;
        if (identity) codeMeta.uniqueUsers.add(identity);
        for (const cl of interaction.conversionLinks) {
          if (cl.conversion?.id) codeMeta.conversions.add(cl.conversion.id);
        }

        statsMap.set(codeId, codeMeta);
      }

      // Aggregate totals
      let totalInteractions = 0;
      let totalUniqueInteractions = 0;
      let totalConversions = 0;

      const codeStats = Array.from(statsMap.values()).map((stat) => {
        const uniqueInteractions = stat.uniqueUsers.size;
        const conversions = stat.conversions.size;

        totalInteractions += stat.interactions;
        totalUniqueInteractions += uniqueInteractions;
        totalConversions += conversions;

        return {
          code: stat.code,
          interactions: stat.interactions,
          uniqueInteractions,
          conversions,
          conversionRate: uniqueInteractions
            ? conversions / uniqueInteractions
            : 0,
        };
      });

      const topCodes = [...codeStats]
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 3);

      // ✅ Efficient total unique conversions
      const uniqueConversionsRes = await this.prisma.$queryRaw<
        { count: number }[]
      >`
      SELECT COUNT(DISTINCT COALESCE("userId", "fingerprint")) as count
      FROM "conversions"
      WHERE id IN (
        SELECT "conversionId"
        FROM "conversion_interactions"
        JOIN "interactions" ON "interactions"."id" = "conversion_interactions"."interactionId"
        JOIN "codes" ON "codes"."id" = "interactions"."codeId"
        WHERE "codes"."campaignId" = ${campaignId}
          AND "codes"."deleted_at" IS NULL
      )
    `;
      const totalUniqueConversions = uniqueConversionsRes[0]?.count || 0;

      return new OkResponse({
        campaignId,
        totalInteractions,
        totalUniqueInteractions,
        totalConversions,
        totalUniqueConversions,
        conversionRate: totalUniqueInteractions
          ? totalConversions / totalUniqueInteractions
          : 0,
        codes: codeStats,
        topCodes,
      });
    } catch (error) {
      this.logger.error('Error in getAnalytics:', error);
      return new InternalServerErrorResponse('Failed to fetch analytics');
    }
  }
}
