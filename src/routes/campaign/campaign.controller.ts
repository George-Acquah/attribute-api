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
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { PoliciesGuard } from 'src/shared/guards/policies.guard';
import { CheckPolicies } from 'src/shared/decorators/policies.decorator';
import { Action } from 'src/shared/enums/casl.enums';
import { CreateCampaignDto } from './dtos/create-campaign.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { PaginationParams } from 'src/shared/dtos/pagination.dto';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';

@Controller('campaigns')
@UseGuards(FirebaseAuthGuard, PoliciesGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post('create')
  @CheckPolicies((ability) => ability.can(Action.Create, 'Campaign'))
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    const result = await this.campaignService.createCampaign(dto, userId);

    return result;
  }

  @Get('all')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Campaign'))
  async getAll(@Query() pagination: PaginationParams) {
    const result = await this.campaignService.findAllCampaigns(pagination);

    return result;
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Campaign'))
  async getOne(@Param('id') id: string) {
    const result = await this.campaignService.findOneCampaign(id);
    return result;
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Campaign'))
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateCampaignDto,
  ) {
    const result = await this.campaignService.updateCampaign(id, dto, userId);

    return result;
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Campaign'))
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const result = await this.campaignService.deleteCampaign(id, userId);

    return result;
  }
}
