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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { RequirePermission } from 'src/shared/decorators/require-permission.decorator';
import { Action } from 'src/shared/enums/casl.enums';
import { ApiGlobalResponses } from 'src/shared/decorators/swagger.decorator';
// import { PaginationParams } from 'src/shared/dtos/pagination.dto';
import { Cacheable } from 'src/shared/decorators/cacheable.decorator';
import { PoliciesGuard } from 'src/shared/guards/policies.guard';
import { SessionAuthGuard } from 'src/shared/guards/session-auth.guard';
// import { Session } from 'src/shared/decorators/session.decorator';
import { CacheInterceptor } from 'src/shared/interceptors/cache.interceptor';
import { RedisCacheableKeyPrefixes } from 'src/shared/constants/redis.constants';
// import { instanceToPlain } from 'class-transformer';
import { Controller } from '@nestjs/common/decorators/core/controller.decorator';
import { CountryService } from './country.service';

@ApiTags('Country')
@ApiBearerAuth()
@ApiGlobalResponses()
// @Session('admin')
@UseGuards(SessionAuthGuard, PoliciesGuard)
@Controller('country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Search term (optional)',
  })
  @Cacheable(
    (_, query) => `${RedisCacheableKeyPrefixes.COUNTRIES_ALL}:${query.query}`,
    60 * 60 * 12,
  )
  @UseInterceptors(CacheInterceptor)
  @Get('')
  @RequirePermission(Action.Read, 'Country')
  @ApiOperation({ summary: 'Get all countries' })
  async getAllCountries(@Query('query') query?: string) {
    return await this.countryService.findAll(query);
  }
}
