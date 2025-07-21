import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { PoliciesGuard } from 'src/shared/guards/policies.guard';
import { CheckPolicies } from 'src/shared/decorators/policies.decorator';
import { Action } from 'src/shared/enums/casl.enums';
import { CreateCampaignDto } from './dtos/create-campaign.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { PaginationParams } from 'src/shared/dtos/pagination.dto';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { UpdateCampaignDto } from './dtos/update-campaign.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiCreatedResponseWithModel,
  ApiGlobalResponses,
  ApiOkResponseWithModel,
  ApiPaginatedResponse,
} from 'src/shared/decorators/swagger.decorator';
import { CampaignDto } from './dtos/get-campaign.dto';
import { CacheInterceptor } from 'src/shared/interceptors/cache.interceptor';
import { Cacheable } from 'src/shared/decorators/cacheable.decorator';
import { buildPaginatedListCacheKey } from 'src/shared/utils/cache-key';

const CONTROLLER_PATH = 'campaigns';
@ApiBearerAuth()
@UseInterceptors(CacheInterceptor)
@Controller(CONTROLLER_PATH)
@ApiGlobalResponses()
@UseGuards(FirebaseAuthGuard, PoliciesGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post('create')
  @ApiCreatedResponseWithModel(CampaignDto)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Campaign'))
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    const result = await this.campaignService.createCampaign(
      dto,
      userId,
      CONTROLLER_PATH,
    );

    return result;
  }

  @Get('all')
  @Cacheable(
    (_, query) => buildPaginatedListCacheKey(CONTROLLER_PATH, query),
    60,
  )
  @ApiPaginatedResponse(CampaignDto)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Campaign'))
  async getAll(@Query() pagination: PaginationParams) {
    const result = await this.campaignService.findAllCampaigns(pagination);
    return result;
  }

  @Get(':id')
  @Cacheable((_, params) => `${CONTROLLER_PATH}:${params.id}`, 60)
  @ApiOkResponseWithModel(CampaignDto)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Campaign'))
  async getOne(@Param('id') id: string) {
    const result = await this.campaignService.findOneCampaign(id);
    return result;
  }

  @Patch(':id')
  @ApiOkResponseWithModel(CampaignDto)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Campaign', 'all'))
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    const result = await this.campaignService.updateCampaign(
      id,
      dto,
      userId,
      CONTROLLER_PATH,
    );

    return result;
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Campaign'))
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const result = await this.campaignService.deleteCampaign(
      id,
      userId,
      CONTROLLER_PATH,
    );

    return result;
  }
}
