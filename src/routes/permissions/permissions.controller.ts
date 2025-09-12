import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
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

@ApiTags('Permissions')
@ApiBearerAuth()
@ApiGlobalResponses()
@Session('admin')
@UseGuards(SessionAuthGuard, PoliciesGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('role/:roleId')
  @RequirePermission(Action.Read, 'RolePermission')
  @ApiOperation({ summary: 'Get permissions for a role' })
  async getForRole(@Param('roleId') roleId: string) {
    return this.permissionsService.findAllForRole(roleId);
  }

  @Cacheable(
    (_, query) => buildPaginatedListCacheKey('permissions:user', query),
    60,
  )
  @Get('user/:userId')
  @RequirePermission(Action.Read, 'RolePermission')
  @ApiOperation({
    summary: 'Get permissions for a user (via roles), paginated',
  })
  async getForUser(
    @Param('userId') userId: string,
    @Query() pagination: PaginationParams,
  ) {
    return this.permissionsService.findAllForUser(userId, pagination);
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
