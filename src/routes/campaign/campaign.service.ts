import { Injectable, Logger } from '@nestjs/common';
import { Campaign, Prisma } from '@prisma/client';
import { _ICreateCampaign } from 'src/shared/interfaces/campaign.interface';
import { _IPaginationParams } from 'src/shared/interfaces/pagination.interface';
import {
  ApiResponse,
  CreatedResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  OkResponse,
} from 'src/shared/res/api.response';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  async createCampaign(
    dto: _ICreateCampaign,
    userId: string,
  ): Promise<ApiResponse<Campaign>> {
    try {
      const result = await this.prisma.campaign.create({
        data: {
          name: dto.name,
          ownerId: userId,
        },
      });

      return new CreatedResponse(
        result,
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
      searchField: 'name',
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

  async updateCampaign(id: string, dto: _ICreateCampaign, userId: string) {
    try {
      const campaign = await this.prisma.campaign.findUnique({ where: { id } });

      if (!campaign)
        return new NotFoundResponse('Campaign with this id does not exist');

      if (campaign.ownerId !== userId) return new ForbiddenResponse();

      const result = await this.prisma.campaign.update({
        where: { id },
        data: dto,
      });

      return new OkResponse(result, 'Campaign updated successfully');
    } catch (error) {
      this.logger.error(error);
      return new InternalServerErrorResponse();
    }
  }

  async deleteCampaign(id: string, userId: string) {
    try {
      const campaign = await this.prisma.campaign.findUnique({ where: { id } });

      if (!campaign)
        return new NotFoundResponse('Campaign with this id does not exist');

      if (campaign.ownerId !== userId) return new ForbiddenResponse();

      const result = await this.prisma.campaign.delete({
        where: { id },
      });

      return new OkResponse(result, 'Campaign deleted successfully');
    } catch (error) {
      this.logger.error(error);
      return new InternalServerErrorResponse();
    }
  }
}
