import { applyDecorators } from '@nestjs/common/decorators/core/apply-decorators';
import { SetMetadata } from '@nestjs/common/decorators/core/set-metadata.decorator';

export const SESSION_ROLE_KEY = 'SESSION_ROLE';
export const SESSION_GUARD_KEY = 'SESSION_GUARD';

export const Session = (
  role: 'admin' | 'user' = 'user',
  guardType: 'local' | 'auth' = 'auth',
) => {
  return applyDecorators(
    SetMetadata(SESSION_ROLE_KEY, role),
    SetMetadata(SESSION_GUARD_KEY, guardType),
  );
};
