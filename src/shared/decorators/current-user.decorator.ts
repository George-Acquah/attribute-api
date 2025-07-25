import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (
    data: keyof _ISafeUser,
    ctx: ExecutionContext,
  ): _ISafeUser | _ISafeUser[keyof _ISafeUser] => {
    const request: Request = ctx.switchToHttp().getRequest();
    if (!request.user) return null;
    return data ? request.user?.[data] : request.user;
  },
);
