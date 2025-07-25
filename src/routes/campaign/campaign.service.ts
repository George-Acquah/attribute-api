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

  async getAnalytics(campaignId: string) {
    try {
      //TOtal Number of people that performed an action divided interacted
      // Validate campaignId
      if (!campaignId || typeof campaignId !== 'string')
        return new BadRequestResponse('Invalid campaign ID');

      const codes = await this.prisma.code.findMany({
        where: {
          campaignId,
          deletedAt: null,
        },
        include: {
          interactions: {
            include: {
              conversionLinks: {
                include: {
                  conversion: true,
                },
              },
            },
          },
        },
      });

      // Handle case where no codes are found
      if (!codes.length)
        return new OkResponse(
          {
            campaignId,
            totalInteractions: 0,
            totalUniqueInteractions: 0,
            totalConversions: 0,
            conversionRate: 0,
            codes: [],
            topCodes: [],
          },
          'No codes found for this campaign',
        );

      let totalInteractions = 0;
      let totalUniqueInteractions = 0;
      let totalConversions = 0;

      const codeStats = codes.map((code) => {
        try {
          const rawInteractions = code.interactions ?? [];

          const interactions = rawInteractions.length;

          const uniqueUsers = new Set(
            rawInteractions
              .map((i) => i.userId || i.fingerprint)
              .filter(Boolean),
          );
          const uniqueInteractions = uniqueUsers.size;

          const conversions = new Set(
            rawInteractions.flatMap((i) =>
              i.conversionLinks?.map((cl) => cl.conversion?.id).filter(Boolean),
            ) ?? [],
          ).size;

          totalInteractions += interactions;
          totalUniqueInteractions += uniqueInteractions;
          totalConversions += conversions;

          return {
            code: code.code,
            interactions,
            uniqueInteractions,
            conversions,
            conversionRate: uniqueInteractions
              ? conversions / uniqueInteractions
              : 0,
          };
        } catch (error) {
          this.logger.error(`Error processing code ${code.code}:`, error);
          return {
            code: code.code,
            interactions: 0,
            conversions: 0,
            conversionRate: 0,
          };
        }
      });

      const topCodes = [...codeStats]
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 3);

      return new OkResponse({
        campaignId,
        totalInteractions,
        totalUniqueInteractions,
        totalConversions,
        conversionRate:
          totalUniqueInteractions > 0
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
