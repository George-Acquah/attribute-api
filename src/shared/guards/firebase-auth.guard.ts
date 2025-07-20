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
import { UsersService } from 'src/routes/users/users.service';
import { RedisKeyPrefixes } from '../constants/redis.constants';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private firebaseAdminService: FirebaseAdminService,
    private userService: UsersService,
    private redisService: RedisService, // optional
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request;
    const sessionCookie = request.cookies?.session;

    if (!sessionCookie) {
      this.logger.warn('Missing session cookie');
      throw new UnauthorizedException('Missing session cookie');
    }

    try {
      // 1. Verify Firebase session
      const decoded = await this.firebaseAdminService.verifySessionCookie(
        sessionCookie,
      );
      const uid = decoded.uid;

      // 2. Try to fetch user info from Redis
      const redisKey = `${RedisKeyPrefixes.FIREBASE_GUARD_USER_KEY}${uid}`;
      const userData = await this.redisService.get<_ISafeUser>(redisKey);

      let user: _ISafeUser;
      if (userData) {
        user = userData;
        this.logger.log(`Loaded user role from Redis: ${user.id}`);
      } else {
        // 3. Fallback to DB
        user = await this.userService.findByUid(decoded.email);
        if (!user) {
          throw new UnauthorizedException('User not found');
        }

        // 4. Cache the result in Redis for 10 minutes
        await this.redisService.set(redisKey, user, 600);
      }

      // 5. Attach user to request
      request.user = {
        id: user.id,
        // uid,
        email: user.email,
        // role: user.role,
      };

      return true;
    } catch (error) {
      this.logger.error('AuthGuard error:', error.message || error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
