import { createParamDecorator } from '@nestjs/common';
import { Request } from 'express';

export const Fingerprint = createParamDecorator((_, context) => {
  void _;
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

  return {
    metadata,
    fingerprint,
  };
});
