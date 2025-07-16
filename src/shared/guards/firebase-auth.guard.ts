// auth/firebase-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FirebaseAdminService } from '../services/firebase/firebase-admin.service';
import { RedisService } from '../services/redis/redis.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private logger = new Logger(FirebaseAuthGuard.name);
  constructor(
    private firebaseAdminService: FirebaseAdminService,
    private readonly redisService: RedisService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const sessionCookie = request.cookies['session'] as
      | string
      | undefined
      | null;

    if (!sessionCookie) return false;

    try {
      const decodedClaims = await this.firebaseAdminService.verifySessionCookie(
        sessionCookie,
      );

      if (!decodedClaims.email) return false;

      const redisKey = `session:${decodedClaims.uid}`;
      const cachedToken = await this.redisService.get(redisKey);
      this.logger.log('Redis has cached token: ', cachedToken);

      if (!cachedToken || cachedToken !== sessionCookie) {
        throw new UnauthorizedException('Session expired or invalid');
      }

      request['user'] = {
        id: decodedClaims.dbUserId,
        email: decodedClaims.email,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase ID token');
    }
  }
}
