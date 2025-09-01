import { createParamDecorator } from '@nestjs/common/decorators/http/create-route-param-metadata.decorator';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
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
