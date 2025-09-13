import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator';
import {
  // Delete,
  Get,
  // Patch,
  // Post,
} from '@nestjs/common/decorators/http/request-mapping.decorator';
import {
  // Body,
  // Param,
  Query,
} from '@nestjs/common/decorators/http/route-params.decorator';
import { UseInterceptors } from '@nestjs/common/decorators/core/use-interceptors.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RequirePermission } from 'src/shared/decorators/require-permission.decorator';
import { Action } from 'src/shared/enums/casl.enums';
import { ApiGlobalResponses } from 'src/shared/decorators/swagger.decorator';
// import { PaginationParams } from 'src/shared/dtos/pagination.dto';
import { Cacheable } from 'src/shared/decorators/cacheable.decorator';
// import { buildPaginatedListCacheKey } from 'src/shared/utils/cache-key';
import { PoliciesGuard } from 'src/shared/guards/policies.guard';
import { SessionAuthGuard } from 'src/shared/guards/session-auth.guard';
// import { Session } from 'src/shared/decorators/session.decorator';
import { CacheInterceptor } from 'src/shared/interceptors/cache.interceptor';
import { RedisCacheableKeyPrefixes } from 'src/shared/constants/redis.constants';
import { instanceToPlain } from 'class-transformer';
import { Controller } from '@nestjs/common/decorators/core/controller.decorator';
import { RegionService } from './region.service';
import { FindRegionsFilterDto } from './dtos/find-region.dto';

@ApiTags('Region')
@ApiBearerAuth()
@ApiGlobalResponses()
// @Session('admin')
@UseGuards(SessionAuthGuard, PoliciesGuard)
@Controller('region')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Cacheable((_, query) => {
    const keyPart =
      query?.countryId || query?.countryCode || query?.countryName || 'unknown';
    const regionQuery = query?.query ?? '';
    return `${RedisCacheableKeyPrefixes.REGIONS_ALL}:${keyPart}:${regionQuery}`;
  }, 60 * 60 * 12)
  @UseInterceptors(CacheInterceptor)
  @Get()
  @RequirePermission(Action.Read, 'Region')
  @ApiOperation({ summary: 'Get regions by flexible country filter' })
  async getRegions(@Query() query: FindRegionsFilterDto) {
    return await this.regionService.findRegionsByFilter(instanceToPlain(query));
  }
}
