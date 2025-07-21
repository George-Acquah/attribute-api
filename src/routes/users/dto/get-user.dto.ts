import { User } from '@prisma/client';
import { generateDtoClassFromType } from 'src/shared/utils/type-to-dto';

export const UserDto = generateDtoClassFromType<User>(
  {
    id: '',
    name: '',

    email: '',

    createdAt: new Date(),
    img: '',
    updatedAt: new Date(),
    uid: '',
    deletedAt: new Date(),
  },
  'UsersDto',
);
