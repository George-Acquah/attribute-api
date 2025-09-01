import { createParamDecorator } from '@nestjs/common/decorators/http/create-route-param-metadata.decorator';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';

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
