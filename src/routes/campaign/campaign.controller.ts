import { Controller } from '@nestjs/common/decorators/core/controller.decorator';
import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator';
import {
  Delete,
  Get,
  Patch,
  Post,
} from '@nestjs/common/decorators/http/request-mapping.decorator';
import {
  Body,
  Param,
  Query,
} from '@nestjs/common/decorators/http/route-params.decorator';
import { CampaignService } from './campaign.service';
import { PoliciesGuard } from 'src/shared/guards/policies.guard';
import { Action } from 'src/shared/enums/casl.enums';
import { CreateCampaignDto } from './dtos/create-campaign.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { PaginationParams } from 'src/shared/dtos/pagination.dto';
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
import { CodeDto } from '../codes/dto/get-code.dto';
import { ApiTags } from '@nestjs/swagger';
import { Fingerprint } from 'src/shared/decorators/fingerprints.decorator';
import { SessionAuthGuard } from 'src/shared/guards/session-auth.guard';
import { UseInterceptors } from '@nestjs/common/decorators/core/use-interceptors.decorator';
import { RequirePermission } from 'src/shared/decorators/require-permission.decorator';

const CONTROLLER_PATH = 'campaigns';
@ApiTags('Campaigns')
@ApiBearerAuth()
@UseInterceptors(CacheInterceptor)
@Controller(CONTROLLER_PATH)
@ApiGlobalResponses()
@UseGuards(SessionAuthGuard, PoliciesGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post('create')
  @ApiCreatedResponseWithModel(CampaignDto)
  @RequirePermission(Action.Read, 'Campaign')
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    return await this.campaignService.createCampaign(
      dto,
      userId,
      CONTROLLER_PATH,
    );
  }

  @Get('all')
  @Cacheable(
    (_, query, __, user: _ISafeUser) =>
      buildPaginatedListCacheKey(`${CONTROLLER_PATH}:${user.id}`, query),
    60,
  )
  @ApiPaginatedResponse(CampaignDto)
  @RequirePermission(Action.Read, 'Campaign')
  async getAll(@Query() pagination: PaginationParams) {
    return await this.campaignService.findAllCampaigns(pagination);
  }

  @Get(':id')
  @Cacheable(
    (params, _, __, user: _ISafeUser) =>
      `${CONTROLLER_PATH}:${user.id}:${params.id}`,
    60,
  )
  @ApiOkResponseWithModel(CampaignDto)
  @RequirePermission(Action.Read, 'Campaign')
  async getOne(@Param('id') id: string) {
    return await this.campaignService.findOneCampaign(id);
  }

  @Patch(':campaignId')
  @ApiOkResponseWithModel(CampaignDto)
  @RequirePermission(Action.Update, 'Campaign')
  async update(
    @CurrentUser('id') userId: string,
    @Param('campaignId') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return await this.campaignService.updateCampaign(
      id,
      dto,
      userId,
      CONTROLLER_PATH,
    );
  }

  @Patch(':campaignId/webhook')
  @ApiOkResponseWithModel(CampaignDto)
  @RequirePermission(Action.Read, 'Campaign')
  async setWebhookUrl(
    @Param('campaignId') id: string,
    @Query('webhookUrl') webhookUrl: string,
  ) {
    return await this.campaignService.updateWebhookUrl(
      id,
      webhookUrl,
      CONTROLLER_PATH,
    );
  }

  @Delete(':campaignId')
  @RequirePermission(Action.Delete, 'Campaign')
  @ApiOkResponseWithModel(CampaignDto)
  async remove(
    @CurrentUser('id') userId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return await this.campaignService.deleteCampaign(
      campaignId,
      userId,
      CONTROLLER_PATH,
    );
  }

  @Get(':campaignId/analytics')
  @Cacheable(
    (params) => `${CONTROLLER_PATH}:analytics:${params.campaignId}`,
    60,
  ) // 1 minutes cache
  @ApiOkResponseWithModel(CodeDto)
  @RequirePermission(Action.Read, 'Campaign')
  async getAnalytics(
    @Param('campaignId') campaignId: string,
    @Fingerprint('fingerprint') fingerprint: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.campaignService.getAnalytics(
      campaignId,
      fingerprint,
      userId,
    );
  }
}
