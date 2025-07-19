import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { User } from '@prisma/client';
import {
  ApiResponse,
  BadRequestResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  OkResponse,
} from 'src/shared/res/api.response';
import { FirebaseAdminService } from 'src/shared/services/firebase/firebase-admin.service';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { RedisService } from 'src/shared/services/redis/redis.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private readonly firebaseService: FirebaseAdminService,
    private readonly redisService: RedisService,
  ) {}

  async authenticateUser(
    accessToken: string,
    expiresIn: number,
  ): Promise<ApiResponse<{ sessionCookie: string; user: User }>> {
    try {
      const decodedToken = await this.firebaseService.verifyToken(accessToken);
      if (!decodedToken || !decodedToken.email) {
        return new BadRequestResponse('Invalid token');
      }

      const user = await this.prisma.user.upsert({
        where: { email: decodedToken.email },
        create: {
          email: decodedToken.email,
          name: decodedToken.name || '',
          img: decodedToken.picture,
          // uid: decodedToken.uid,
        },
        update: {
          name: decodedToken.name || '',
          img: decodedToken.picture,
        },
      });

      const sessionCookie = await this.firebaseService.createSessionCookie(
        accessToken,
        expiresIn,
      );

      const redisKey = `session:${decodedToken.uid}`;
      await this.redisService.set(redisKey, sessionCookie, expiresIn / 1000);

      return new OkResponse(
        { sessionCookie, user },
        'Authenticated successfully',
      );
    } catch (error) {
      this.logger.error('authenticateUser error:', error);
      return new InternalServerErrorResponse();
    }
  }

  async getUserInfo(email: string): Promise<ApiResponse<User>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) return new NotFoundResponse('User does not exist');

      return new OkResponse(user, 'User found');
    } catch (error) {
      this.logger.error('getUserInfo error:', error);
      return new InternalServerErrorResponse();
    }
  }

  async revokeTokens(sessionToken: string): Promise<ApiResponse<null>> {
    try {
      const decodedClaims = await this.firebaseService.verifySessionCookie(
        sessionToken,
      );

      await this.firebaseService.removeRefreshTokens(decodedClaims.sub);

      return new OkResponse(null);
    } catch (_error) {
      return new InternalServerErrorResponse();
    }
  }
}
