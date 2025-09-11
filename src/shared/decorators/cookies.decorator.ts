import { createParamDecorator } from '@nestjs/common/decorators/http/create-route-param-metadata.decorator';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { Request } from 'express';

export const Cookies = createParamDecorator(
  (
    data: 'session' | 'visitor_id' | null,
    ctx: ExecutionContext,
  ): _ISessionCookie | string | _ICookies => {
    const request: Request = ctx.switchToHttp().getRequest();

    const firebase = request.cookies?.firebase_session;
    const custom = request.cookies?.custom_session;
    const visitorId = request.cookies?.visitor_id;

    if (data === 'session') {
      if (firebase) return { token: firebase, type: 'firebase' };
      if (custom) return { token: custom, type: 'custom' };
      return null;
    }

    if (data === 'visitor_id') {
      return visitorId || null;
    }

    return {
      session: firebase
        ? { token: firebase, type: 'firebase' }
        : custom
        ? { token: custom, type: 'custom' }
        : null,
      visitorId: visitorId || null,
    };
  },
);
