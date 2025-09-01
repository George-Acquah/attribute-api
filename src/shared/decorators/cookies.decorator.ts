import { createParamDecorator } from '@nestjs/common/decorators/http/create-route-param-metadata.decorator';
import { Request } from 'express';

export const Cookies = createParamDecorator(
  (data: 'session' | 'visitor_id', ctx) => {
    const request: Request = ctx.switchToHttp().getRequest();
    return data ? request.cookies?.[data] : request.cookies;
  },
);
