import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { Prisma, User } from '@prisma/client';
import { _IPaginationParams } from 'src/shared/interfaces/pagination.interface';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}
  async findByUid(uid: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: uid },
        select: {
          id: true,
          email: true,
        },
      });

      if (!user) throw new NotFoundException('User does not exist');

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

  async findAll(dto: _IPaginationParams) {
    return await this.paginationService.paginateAndFilter<
      User,
      Prisma.UserWhereInput,
      Prisma.UserInclude,
      Prisma.UserOrderByWithRelationInput
    >(this.prisma.user, {
      ...dto,
      searchFields: ['email', 'name'],
      searchValue: dto.query,
      // where: { isActive: true },
      include: { campaigns: true },
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
