import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';
import { Campaign, Code, Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';
import { _ICreateCampaign } from 'src/shared/interfaces/campaign.interface';
import { _IPaginationParams } from 'src/shared/interfaces/pagination.interface';
import { ApiResponse } from 'src/shared/res/api.response';
import {
  BadRequestResponse,
  CreatedResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  OkResponse,
} from 'src/shared/res/responses';
import {
  PaginationService,
  PrismaService,
  RedisService,
} from 'src/shared/services';
import { AuditService } from 'src/shared/services/common/audit.service';
import { AsyncContextService } from 'src/shared/services/context/async-context.service';
import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';
import { generateQrDataUrl } from 'src/shared/utils/codes';
import { handleError } from 'src/shared/utils/errors';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly redis: RedisService,
    private readonly transaction: PrismaTransactionService,
    private readonly context: AsyncContextService,
    private readonly audit: AuditService,
  ) {}

  async createCampaign(
    dto: _ICreateCampaign,
    path: string,
  ): Promise<ApiResponse<Campaign & { codes: Code[] }>> {
    try {
      const userId = this.context.get('user')?.id;
      const [campaign, codes] = await this.transaction.run(async (tx) => {
        const createdCampaign = await tx.campaign.create({
          data: {
            name: dto.name,
            medium: dto.medium,
            budget: dto.budget,
            ownerId: userId,

            channelId: dto.channelId,
            regionId: dto.regionId,
          },
        });

        const numberOfCodes = dto.numberOfCodes ?? 1;
        const createdCode = await Promise.all(
          Array.from({ length: numberOfCodes }).map(async () => {
            const codeValue = nanoid(8);
            const qrUrl = await generateQrDataUrl(codeValue);
            return await tx.code.create({
              data: {
                campaignId: createdCampaign.id,
                code: codeValue,

                qrUrl,
              },
            });
          }),
        );

        await this.audit.logAction(
          {
            action: 'create',
            entityType: 'Campaign',
            entityId: createdCampaign.id,
            metadata: {
              createdBy: userId,
              campaignName: createdCampaign.name,
              channelId: dto.channelId,
              regionId: dto.regionId,
              numberOfCodes: numberOfCodes,
            },
          },
          tx,
        );

        return [createdCampaign, createdCode] as const;
      }, 'regionId and channelId');

      await this.invalidateCampaignCache(path);

      return new CreatedResponse(
        { ...campaign, codes },
        'Your campaign has been created successfully',
      );
    } catch (error) {
      return handleError(
        'CampaignService.createCampaign',
        error,
        'Failed to create campaign',
        this.logger,
      );
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
    path: string,
  ) {
    try {
      const userId = this.context.get('user')?.id;
      const campaign = await this.prisma.campaign.findUnique({ where: { id } });

      if (!campaign)
        return new NotFoundResponse('Campaign with this id does not exist');

      if (campaign.ownerId !== userId) return new ForbiddenResponse();

      const result = await this.transaction.run(async (tx) => {
        const updatedCampaign = await tx.campaign.update({
          where: { id },
          data: {
            name: dto.name,
            medium: dto.medium,
            budget: dto.budget,
            ownerId: userId,

            channelId: '',
            regionId: '',
          },
        });

        await this.audit.logAction(
          {
            action: 'update',
            entityType: 'Campaign',
            entityId: updatedCampaign.id,
            metadata: {
              updatedBy: userId,
              before: {
                campaignName: campaign.name,
                channelId: campaign.channelId,
                regionId: campaign.regionId,
              },
              after: {
                campaignName: updatedCampaign.name,
                channelId: updatedCampaign.channelId,
                regionId: updatedCampaign.regionId,
              },
            },
          },
          tx,
        );

        return updatedCampaign;
      });

      await this.invalidateCampaignCache(path);

      return new OkResponse(result, 'Campaign updated successfully');
    } catch (error) {
      this.logger.error(error);
      return new InternalServerErrorResponse();
    }
  }

  async updateWebhookUrl(id: string, webhookUrl: string, path: string) {
    try {
      if (!id || !webhookUrl) {
        return new BadRequestResponse(
          'Campaign ID and webhook URL are required.',
        );
      }
      const campaign = await this.prisma.campaign.findUnique({
        where: { id },
      });

      if (!campaign) {
        return new NotFoundResponse(`Campaign with ID ${id} not found.`);
      }

      const updatedCampaign = await this.prisma.campaign.update({
        where: { id },
        data: { webhookUrl },
      });

      await this.invalidateCampaignCache(path);

      return new OkResponse(
        updatedCampaign,
        `Webhook URL updated successfully for campaign ${id}.`,
      );
    } catch (err) {
      return handleError(
        `updateWebhookUrl(${id})`,
        err,
        `Failed to update webhook URL for campaign ${id}`,
      );
    }
  }

  async deleteCampaign(id: string, path: string) {
    try {
      const userId = this.context.get('user')?.id;
      const campaign = await this.prisma.campaign.findUnique({ where: { id } });

      if (!campaign)
        return new NotFoundResponse('Campaign with this id does not exist');

      if (campaign.ownerId !== userId) return new ForbiddenResponse();

      const result = await this.transaction.run(async (tx) => {
        const deletedCampaign = await tx.campaign.delete({
          where: { id },
        });
        await this.audit.logAction(
          {
            action: 'update',
            entityType: 'Campaign',
            entityId: deletedCampaign.id,
            metadata: {
              updatedBy: userId,
              before: {
                campaignName: campaign.name,
                channelId: campaign.channelId,
                regionId: campaign.regionId,
              },
              after: null,
            },
          },
          tx,
        );

        return deletedCampaign;
      });

      await this.invalidateCampaignCache(path);

      return new OkResponse(result, 'Campaign deleted successfully');
    } catch (error) {
      this.logger.error(error);
      return new InternalServerErrorResponse();
    }
  }

  async getAnalytics(campaignId: string, fingerprint: string) {
    const userId = this.context.get('user')?.id;
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

  private async invalidateCampaignCache(path: string) {
    await Promise.allSettled([
      this.redis.delByPattern(`${path}:list:*`),
      this.redis.delByPattern(`${path}:analytics:*`),
    ]);
  }
}
