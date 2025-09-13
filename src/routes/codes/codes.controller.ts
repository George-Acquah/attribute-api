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
import { PoliciesGuard } from 'src/shared/guards/policies.guard';
import {
  ApiCreatedResponseWithModel,
  ApiGlobalResponses,
  ApiOkResponseWithModel,
  ApiPaginatedResponse,
} from 'src/shared/decorators/swagger.decorator';
import { Action } from 'src/shared/enums/casl.enums';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { instanceToPlain } from 'class-transformer';
import { Cacheable } from 'src/shared/decorators/cacheable.decorator';
import { PaginationParams } from 'src/shared/dtos/pagination.dto';
import { buildPaginatedListCacheKey } from 'src/shared/utils/cache-key';
import { CodeDto } from './dto/get-code.dto';
import { CacheInterceptor } from 'src/shared/interceptors/cache.interceptor';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/shared/guards/session-auth.guard';
import { RequirePermission } from 'src/shared/decorators/require-permission.decorator';

const CONTROLLER_PATH = 'codes';
@ApiTags('Codes')
@UseGuards(SessionAuthGuard, PoliciesGuard)
@UseInterceptors(CacheInterceptor)
@Controller(CONTROLLER_PATH)
@ApiGlobalResponses()
export class CodesController {
  constructor(private readonly codesService: CodesService) {}

  @Post('campaign/:campaignId/generate')
  @ApiCreatedResponseWithModel(CodeDto)
  @RequirePermission(Action.Create, 'Code')
  async generateCodes(
    @Param('campaignId') campaignId: string,
    @Body() dto: GenerateCodeDto,
  ) {
    return await this.codesService.generateCodesForCampaign(
      campaignId,
      instanceToPlain(dto, {
        exposeDefaultValues: true,
      }),
      CONTROLLER_PATH,
    );
  }

  @Get(':codeId')
  @ApiOkResponseWithModel(CodeDto)
  @RequirePermission(Action.Read, 'Code')
  @Cacheable((_, params) => `${CONTROLLER_PATH}:${params.id}`, 60)
  async getCodeById(@Param('codeId') id: string) {
    return await this.codesService.getCodeById(id);
  }

  @Get('/campaign/:campaignId')
  @ApiPaginatedResponse(CodeDto)
  @RequirePermission(Action.Read, 'Code')
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
  @RequirePermission(Action.Delete, 'Code')
  async softDeleteCode(@Param('id') id: string) {
    return this.codesService.softDeleteCode(id, CONTROLLER_PATH);
  }
}
