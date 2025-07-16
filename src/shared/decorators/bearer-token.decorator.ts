// src/common/decorators/bearer-token.decorator.ts
import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const BearerToken = createParamDecorator(
  (data: 'Bearer', ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || typeof authHeader !== 'string')
      throw new UnauthorizedException('Authorization header missing');

    const [type, token] = authHeader.split(' ');

    if (type !== data || !token)
      throw new UnauthorizedException('Invalid token format');

    return type === data && token ? token : null;
  },
);
