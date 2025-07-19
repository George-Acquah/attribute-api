import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FirebaseAdminService } from 'src/shared/services/firebase/firebase-admin.service';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private prisma: PrismaService,
    private readonly firebaseService: FirebaseAdminService,
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
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
