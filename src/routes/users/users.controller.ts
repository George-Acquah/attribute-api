import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
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
import { CheckPolicies } from 'src/shared/decorators/policies.decorator';
import { buildPaginatedListCacheKey } from 'src/shared/utils/cache-key';
import { CacheInterceptor } from 'src/shared/interceptors/cache.interceptor';
import { Action } from 'src/shared/enums/casl.enums';
import { UserDto } from './dto/get-user.dto';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { PoliciesGuard } from 'src/shared/guards/policies.guard';
import { ApiTags } from '@nestjs/swagger';

const CONTROLLER_PATH = 'users';
@ApiTags('Users')
@ApiBearerAuth()
@UseInterceptors(CacheInterceptor)
@UseGuards(FirebaseAuthGuard, PoliciesGuard)
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
  @CheckPolicies((ability) => ability.can(Action.Read, 'User'))
  @Get()
  async findAll(@Query() pagination: PaginationParams) {
    return await this.usersService.findAll(pagination);
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
