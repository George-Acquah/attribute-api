import { Response, Request, NextFunction } from 'express';
import { generateFingerprintFromRequest } from '../utils/fingerprints';

export function fingerprintMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log(
    'MIDDDDDDDDDDDDDLLLLLLLLLLLLLLLLLLLLLLLEEEEEEEEEEEEEEEEWWWWWWWWWWWWARRRRRRRRRRRREEEEEEEEEEE',
  );
  const existingId = req.cookies['visitor_id'];

  if (!existingId) {
    const fp = generateFingerprintFromRequest(req);
    res.cookie('visitor_id', fp, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    req.cookies['visitor_id'] = fp;
  }

  next();
}
