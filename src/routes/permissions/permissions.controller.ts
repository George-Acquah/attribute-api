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
import { UseInterceptors } from '@nestjs/common/decorators/core/use-interceptors.decorator';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RequirePermission } from 'src/shared/decorators/require-permission.decorator';
import { Action } from 'src/shared/enums/casl.enums';
import { ApiGlobalResponses } from 'src/shared/decorators/swagger.decorator';
import { PaginationParams } from 'src/shared/dtos/pagination.dto';
import { Cacheable } from 'src/shared/decorators/cacheable.decorator';
import { buildPaginatedListCacheKey } from 'src/shared/utils/cache-key';
import { ConditionPresetInterceptor } from 'src/shared/interceptors/condition-preset.interceptor';
import { PoliciesGuard } from 'src/shared/guards/policies.guard';
import { SessionAuthGuard } from 'src/shared/guards/session-auth.guard';
import { Session } from 'src/shared/decorators/session.decorator';
import { CacheInterceptor } from 'src/shared/interceptors/cache.interceptor';
import { RedisCacheableKeyPrefixes } from 'src/shared/constants/redis.constants';
import { instanceToPlain } from 'class-transformer';

@ApiTags('Permissions')
@ApiBearerAuth()
@ApiGlobalResponses()
@Session('admin')
@UseGuards(SessionAuthGuard, PoliciesGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Cacheable(
    (_, query, __, user: _ISafeUser) =>
      buildPaginatedListCacheKey(
        `${RedisCacheableKeyPrefixes.ALL_PERMISSIONS}:${user.id}`,
        query,
      ),
    60,
  )
  @UseInterceptors(CacheInterceptor)
  @Get('')
  @RequirePermission(Action.Read, 'RolePermission')
  @ApiOperation({ summary: 'Get all role permissions' })
  async getAllPermissions(@Query() pagination: PaginationParams) {
    return this.permissionsService.findAll(instanceToPlain(pagination));
  }

  @Cacheable(
    (param: { roleId: string }, query, _, user: _ISafeUser) =>
      buildPaginatedListCacheKey(
        `${RedisCacheableKeyPrefixes.ROLE_PERMISSIONS}:${user.id}:${param.roleId}`,
        query,
      ),
    60,
  )
  @UseInterceptors(CacheInterceptor)
  @Get('role/:roleId')
  @RequirePermission(Action.Read, 'RolePermission')
  @ApiOperation({ summary: 'Get permissions for a role' })
  async getForRole(
    @Param('roleId') roleId: string,
    @Query() pagination: PaginationParams,
  ) {
    return this.permissionsService.findAllForRole(
      roleId,
      instanceToPlain(pagination),
    );
  }

  @Cacheable(
    (param: { userId: string }, query, _, user: _ISafeUser) =>
      buildPaginatedListCacheKey(
        `${RedisCacheableKeyPrefixes.USER_PERMISSIONS}:${user.id}:${param.userId}`,
        query,
      ),
    60,
  )
  @UseInterceptors(CacheInterceptor)
  @Get('user/:userId')
  @RequirePermission(Action.Read, 'RolePermission')
  @ApiOperation({
    summary: 'Get permissions for a user (via roles), paginated',
  })
  async getForUser(
    @Param('userId') userId: string,
    @Query() pagination: PaginationParams,
  ) {
    return this.permissionsService.findAllForUser(
      userId,
      instanceToPlain(pagination),
    );
  }

  @UseInterceptors(ConditionPresetInterceptor)
  @Post()
  @RequirePermission(Action.Create, 'RolePermission')
  @ApiOperation({ summary: 'Create a role permission' })
  async create(@Body() body: CreatePermissionDto) {
    const result = await this.permissionsService.create(body);
    return result;
  }

  @UseInterceptors(ConditionPresetInterceptor)
  @Patch(':id')
  @RequirePermission(Action.Update, 'RolePermission')
  @ApiOperation({ summary: 'Update a role permission' })
  async update(@Param('id') id: string, @Body() body: UpdatePermissionDto) {
    const result = await this.permissionsService.update(id, body);
    return result;
  }

  @Delete(':id')
  @RequirePermission(Action.Delete, 'RolePermission')
  @ApiOperation({ summary: 'Delete a role permission' })
  async remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
