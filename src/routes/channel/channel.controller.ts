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
import { PaginationParams } from 'src/shared/dtos/pagination.dto';
import { Cacheable } from 'src/shared/decorators/cacheable.decorator';
import { buildPaginatedListCacheKey } from 'src/shared/utils/cache-key';
import { PoliciesGuard } from 'src/shared/guards/policies.guard';
import { SessionAuthGuard } from 'src/shared/guards/session-auth.guard';
// import { Session } from 'src/shared/decorators/session.decorator';
import { CacheInterceptor } from 'src/shared/interceptors/cache.interceptor';
import { RedisCacheableKeyPrefixes } from 'src/shared/constants/redis.constants';
import { instanceToPlain } from 'class-transformer';
import { Controller } from '@nestjs/common/decorators/core/controller.decorator';
import { ChannelService } from './channel.service';

@ApiTags('Channel')
@ApiBearerAuth()
@ApiGlobalResponses()
// @Session('admin')
@UseGuards(SessionAuthGuard, PoliciesGuard)
@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Cacheable(
    (_, query) =>
      buildPaginatedListCacheKey(
        `${RedisCacheableKeyPrefixes.CHANNELS_ALL}`,
        query,
      ),
    60 * 60 * 12,
  )
  @UseInterceptors(CacheInterceptor)
  @Get('')
  @RequirePermission(Action.Read, 'Channel')
  @ApiOperation({ summary: 'Get all channels' })
  async getAllChannels(@Query() pagination: PaginationParams) {
    return await this.channelService.findAll(instanceToPlain(pagination));
  }
}
