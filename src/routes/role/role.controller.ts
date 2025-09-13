import { RoleService } from './role.service';
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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RequirePermission } from 'src/shared/decorators/require-permission.decorator';
import { Action } from 'src/shared/enums/casl.enums';
import { ApiGlobalResponses } from 'src/shared/decorators/swagger.decorator';
import { PaginationParams } from 'src/shared/dtos/pagination.dto';
import { Cacheable } from 'src/shared/decorators/cacheable.decorator';
import { buildPaginatedListCacheKey } from 'src/shared/utils/cache-key';
import { PoliciesGuard } from 'src/shared/guards/policies.guard';
import { SessionAuthGuard } from 'src/shared/guards/session-auth.guard';
import { Session } from 'src/shared/decorators/session.decorator';
import { CacheInterceptor } from 'src/shared/interceptors/cache.interceptor';
import { RedisCacheableKeyPrefixes } from 'src/shared/constants/redis.constants';
import { instanceToPlain } from 'class-transformer';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';

@ApiTags('Role')
@ApiBearerAuth()
@ApiGlobalResponses()
@Session('admin')
@UseGuards(SessionAuthGuard, PoliciesGuard)
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Cacheable(
    (_, query, __, user: _ISafeUser) =>
      buildPaginatedListCacheKey(
        `${RedisCacheableKeyPrefixes.ROLE_PERMISSIONS}:${user.id}`,
        query,
      ),
    60,
  )
  @UseInterceptors(CacheInterceptor)
  @Get('')
  @RequirePermission(Action.Read, 'RolePermission')
  @ApiOperation({ summary: 'Get all role permissions' })
  async getAllPermissions(@Query() pagination: PaginationParams) {
    return await this.roleService.findAll(instanceToPlain(pagination));
  }

  @Post()
  @RequirePermission(Action.Create, 'Role')
  @ApiOperation({ summary: 'Create a role' })
  async create(@Body() body: CreateRoleDto) {
    const result = await this.roleService.create(body);
    return result;
  }

  @Patch(':id')
  @RequirePermission(Action.Update, 'Role')
  @ApiOperation({ summary: 'Update a role' })
  async update(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    const result = await this.roleService.update(id, body);
    return result;
  }

  @Delete(':id')
  @RequirePermission(Action.Delete, 'Role')
  @ApiOperation({ summary: 'Delete a role' })
  async remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}
