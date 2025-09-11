import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiGlobalResponses,
  ApiPaginatedResponse,
} from 'src/shared/decorators/swagger.decorator';
import { PaginationParams } from 'src/shared/dtos/pagination.dto';
import { Cacheable } from 'src/shared/decorators/cacheable.decorator';
import { buildPaginatedListCacheKey } from 'src/shared/utils/cache-key';
import { CacheInterceptor } from 'src/shared/interceptors/cache.interceptor';
import { Action } from 'src/shared/enums/casl.enums';
import { UserDto } from './dto/get-user.dto';
import { PoliciesGuard } from 'src/shared/guards/policies.guard';
import { ApiTags } from '@nestjs/swagger';
import { UseInterceptors } from '@nestjs/common/decorators/core/use-interceptors.decorator';
import { SessionAuthGuard } from 'src/shared/guards/session-auth.guard';
import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator';
import { Controller } from '@nestjs/common/decorators/core/controller.decorator';
import {
  Post,
  Get,
  Delete,
  Patch,
} from '@nestjs/common/decorators/http/request-mapping.decorator';
import {
  Body,
  Query,
  Param,
} from '@nestjs/common/decorators/http/route-params.decorator';
import { RequirePermission } from 'src/shared/decorators/require-permission.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';

const CONTROLLER_PATH = 'users';
@ApiTags('Users')
@ApiBearerAuth()
@UseInterceptors(CacheInterceptor)
@UseGuards(SessionAuthGuard, PoliciesGuard)
@Controller(CONTROLLER_PATH)
@ApiGlobalResponses()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Cacheable(
    (_, query) => buildPaginatedListCacheKey(CONTROLLER_PATH, query),
    60,
  )
  @ApiPaginatedResponse(UserDto)
  @RequirePermission(Action.Read, 'User')
  @Get()
  async findAll(
    @Query() pagination: PaginationParams,
    @CurrentUser() user: _ISafeUser,
  ) {
    return await this.usersService.findAll(pagination, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
