import { FirebaseAdminService } from '../services/firebase/firebase-admin.service';
import { Request } from 'express';
import { UsersService } from 'src/routes/users/users.service';
import { RedisService } from '../services/redis/redis.service';
import { RedisKeyPrefixes } from '../constants/redis.constants';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { CanActivate } from '@nestjs/common/interfaces/features/can-activate.interface';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';

@Injectable()
export class LocalAuthGuard implements CanActivate {
  constructor(
    private admin: FirebaseAdminService,
    private userService: UsersService,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const sessionCookie = request.cookies?.session;

    if (!sessionCookie) {
      return true;
    }

    try {
      const decoded = await this.admin.verifySessionCookie(sessionCookie);
      const uid = decoded.uid;

      const redisKey = `${RedisKeyPrefixes.SESSION_USER_KEY}${uid}`;
      const userData = await this.redisService.get<_ISafeUser>(redisKey);

      let user: _ISafeUser | null;
      if (userData) {
        user = userData;
      } else {
        user = await this.userService.findByUid(uid);
      }

      if (!user) {
        request.user = null;
      }

      await this.redisService.set(redisKey, user, 600);
      request.user = {
        id: user.id,
        // uid,
        roles: user.roles,
        email: user.email,
      };
    } catch (err) {
      request.user = null;
    }

    return true;
  }
}
