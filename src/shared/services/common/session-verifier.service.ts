import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { UsersService } from 'src/routes/users/users.service';
import { RedisService } from '..';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { RedisKeyPrefixes } from 'src/shared/constants/redis.constants';
import { Request } from 'express';
import { Logger } from '@nestjs/common/services/logger.service';

@Injectable()
export class SessionVerifierService {
  private logger = new Logger(SessionVerifierService.name);
  constructor(
    private readonly redis: RedisService,
    private readonly firebaseService: FirebaseAdminService,
    private readonly userService: UsersService,
  ) {}

  async verifyUserFromRequest(req: Request): Promise<_ISafeUser> {
    const firebaseCookie = req.cookies?.firebase_session as string;
    const customToken = req.cookies?.custom_session;

    if (!firebaseCookie && !customToken) {
      throw new UnauthorizedException('Missing session token');
    }

    let uid: string;

    if (firebaseCookie) {
      const sessionCacheKey = `${RedisKeyPrefixes.FIREBASE_SESSION}:${firebaseCookie}`;
      let decoded = await this.redis.get<{ uid: string }>(sessionCacheKey);

      if (!decoded) {
        decoded = await this.firebaseService.verifySessionCookie(
          firebaseCookie,
        );
        if (!decoded?.uid)
          throw new UnauthorizedException('Invalid Firebase session');

        // Cache decoded token for 2–5 mins max
        const ttl = 300; // 5 minutes
        await this.redis.set(sessionCacheKey, decoded, ttl);
      }

      uid = decoded.uid;
    } else if (customToken) {
      const sessionData = await this.redis.get<{ userId: string }>(
        `${RedisKeyPrefixes.CUSTOM_SESSION}:${customToken}`,
      );
      if (!sessionData?.userId)
        throw new UnauthorizedException('Invalid session token');
      uid = sessionData.userId;
    }

    // 🧠 Load user from Redis cache (if exists)
    const cacheKey = `${RedisKeyPrefixes.SESSION_USER_KEY}${uid}`;
    let user = await this.redis.get<_ISafeUser>(cacheKey);

    if (!user) {
      user = await this.userService.findByUid(uid, !!firebaseCookie);
      if (!user) throw new UnauthorizedException('User not found');
      await this.redis.set(cacheKey, user, 600); // cache for 10 mins
    }

    return user;
  }
}
