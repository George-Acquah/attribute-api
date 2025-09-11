import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { Prisma, User } from '@prisma/client';
import { _IPaginationParams } from 'src/shared/interfaces/pagination.interface';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { InternalServerErrorException } from '@nestjs/common/exceptions/internal-server-error.exception';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Logger } from '@nestjs/common/services/logger.service';
import { CaslAbilityFactory } from 'src/shared/providers/casl.provider';
import { accessibleBy } from '@casl/prisma';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly userSessionSelect = {
    id: true,
    email: true,
    roles: {
      select: {
        role: {
          select: {
            name: true,
          },
        },
      },
    },
  };
  constructor(
    private prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}
  async findByUid(uid: string, uidBool = true): Promise<_ISafeUser> {
    try {
      const whereClause: Prisma.UserWhereUniqueInput = uidBool
        ? { uid }
        : { id: uid };
      const rawUser = await this.prisma.user.findUnique({
        where: whereClause,
        select: this.userSessionSelect,
      });

      if (!rawUser) throw new NotFoundException('User does not exist');

      const user = {
        ...rawUser,
        roles: rawUser.roles.map((r) => r.role.name),
      };

      return user;
    } catch (error) {
      this.logger.error('getUserInfo error:', error);
      throw new InternalServerErrorException();
    }
  }

  create(createUserDto: CreateUserDto) {
    void createUserDto;
    return 'This action adds a new user';
  }

  async findAll(dto: _IPaginationParams, user: _ISafeUser) {
    const ability = await this.caslAbilityFactory.createForUser(user);

    const where = accessibleBy(ability).User;

    return await this.paginationService.paginateAndFilter<
      User,
      Prisma.UserWhereInput,
      unknown,
      Prisma.UserOrderByWithRelationInput,
      Prisma.UserSelect
    >(this.prisma.user, {
      ...dto,
      searchFields: ['email', 'name'],
      searchValue: dto.query,
      where,
      select: {
        ...this.userSessionSelect,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    void updateUserDto;
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
