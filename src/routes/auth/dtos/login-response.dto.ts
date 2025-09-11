import { _ILoginUser } from 'src/shared/interfaces/users.interface';
import { generateDtoClassFromType } from 'src/shared/utils/type-to-dto';

export const LoginResponseDto = generateDtoClassFromType<_ILoginUser>(
  {
    id: '',
    email: '',
    name: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    phone: '',
    avatarUrl: '',
    roles: [],
  },
  'LoginResponseDto',
);
