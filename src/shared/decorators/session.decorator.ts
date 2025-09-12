import { SetMetadata } from '@nestjs/common/decorators/core/set-metadata.decorator';

export const SESSION_ROLE_KEY = 'SESSION_ROLE';

export const Session = (role: 'admin' | 'user' = 'user') =>
  SetMetadata(SESSION_ROLE_KEY, role);
