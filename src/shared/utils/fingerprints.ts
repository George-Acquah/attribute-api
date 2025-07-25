import * as crypto from 'crypto';
import { Request } from 'express';

export function generateFingerprintFromRequest(req: Request): string {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown';

  const userAgent = req.headers['user-agent'] || 'unknown';
  const accept = req.headers['accept'] || '';
  const language = req.headers['accept-language'] || '';
  const encoding = req.headers['accept-encoding'] || '';
  const dnt = req.headers['dnt'] || '';
  const connection = req.headers['connection'] || '';

  const rawString = [
    ip,
    userAgent,
    accept,
    language,
    encoding,
    dnt,
    connection,
  ].join('|');
  console.log('Raw String: ', rawString);

  const hash = crypto.createHash('sha256').update(rawString).digest('hex');
  return hash;
}
