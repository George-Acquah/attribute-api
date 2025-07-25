import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CodesService } from './codes.service';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { PoliciesGuard } from 'src/shared/guards/policies.guard';
import {
  ApiCreatedResponseWithModel,
  ApiGlobalResponses,
  ApiOkResponseWithModel,
  ApiPaginatedResponse,
} from 'src/shared/decorators/swagger.decorator';
import { CheckPolicies } from 'src/shared/decorators/policies.decorator';
import { Action } from 'src/shared/enums/casl.enums';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { instanceToPlain } from 'class-transformer';
import { Cacheable } from 'src/shared/decorators/cacheable.decorator';
import { PaginationParams } from 'src/shared/dtos/pagination.dto';
import { buildPaginatedListCacheKey } from 'src/shared/utils/cache-key';
import { CodeDto } from './dto/get-code.dto';
import { CacheInterceptor } from 'src/shared/interceptors/cache.interceptor';
import { ApiTags } from '@nestjs/swagger';

const CONTROLLER_PATH = 'codes';
@ApiTags('Codes')
@UseGuards(FirebaseAuthGuard, PoliciesGuard)
@UseInterceptors(CacheInterceptor)
@Controller(CONTROLLER_PATH)
@ApiGlobalResponses()
export class CodesController {
  constructor(private readonly codesService: CodesService) {}

  @Post('campaign/:campaignId/generate')
  @ApiCreatedResponseWithModel(CodeDto)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Campaign'))
  async generateCodes(
    @Param('campaignId') campaignId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateCodeDto,
  ) {
    return await this.codesService.generateCodesForCampaign(
      campaignId,
      userId,
      instanceToPlain(dto, {
        exposeDefaultValues: true,
      }),
      CONTROLLER_PATH,
    );
  }

  @Get(':id')
  @ApiOkResponseWithModel(CodeDto)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Code'))
  @Cacheable((_, params) => `${CONTROLLER_PATH}:${params.id}`, 60)
  async getCodeById(@Param('id') id: string) {
    return await this.codesService.getCodeById(id);
  }

  @Get('/campaign/:campaignId')
  @ApiPaginatedResponse(CodeDto)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Campaign'))
  @Cacheable(
    (_, query) => buildPaginatedListCacheKey(CONTROLLER_PATH, query),
    60,
  )
  async getCodesForCampaign(
    @Param('campaignId') campaignId: string,
    @Query() dto: PaginationParams,
  ) {
    return await this.codesService.getCodesByCampaignId(campaignId, dto);
  }

  @Delete(':id')
  @ApiOkResponseWithModel(CodeDto)
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Code'))
  async softDeleteCode(@Param('id') id: string) {
    return this.codesService.softDeleteCode(id, CONTROLLER_PATH);
  }
}
