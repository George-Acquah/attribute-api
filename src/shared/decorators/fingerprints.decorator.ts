import { createParamDecorator } from '@nestjs/common/decorators/http/create-route-param-metadata.decorator';
import { Request } from 'express';

type Data = 'all' | 'meta' | 'fingerprint';
export const Fingerprint = createParamDecorator(
  (data: Data = 'all', context) => {
    const req: Request = context.switchToHttp().getRequest();
    const metadata = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      acceptLanguage: req.headers['accept-language'],
      referer: req.headers['referer'],
      timestamp: new Date().toISOString(),
    };

    console.log('METADATA FROM USER: ', metadata);
    const fingerprint: string = req.cookies['visitor_id'];

    return data === 'fingerprint'
      ? fingerprint
      : data === 'meta'
      ? metadata
      : {
          metadata,
          fingerprint,
        };
  },
);
