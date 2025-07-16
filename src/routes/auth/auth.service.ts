import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
  constructor(
    private prisma: PrismaService,
    private readonly firebaseService: FirebaseAdminService,
    private readonly redisService: RedisService,
  ) {}

  async verifyUser(
    accessToken: string,
  ): Promise<ApiResponse<{ decodedToken: DecodedIdToken; user: User }>> {
    try {
      const decodedToken = await this.firebaseService.verifyToken(accessToken);
      if (!decodedToken) {
        return new BadRequestResponse('Invalid token');
      }
      const user = await this.prisma.user.upsert({
        where: { email: decodedToken.email },
        create: {
          email: decodedToken.email,
          name: decodedToken.name || '',
          img: decodedToken.picture,
        },
        update: {
          name: decodedToken.name || '',
          img: decodedToken.picture,
        },
      });
      if (!user) {
        return new NotFoundResponse('User not found');
      }

      await this.firebaseService.setCustomClaims(decodedToken.uid, user.id);

      const redisKey = `session:${decodedToken.uid}`;
      await this.redisService.set(redisKey, accessToken, 60 * 60 * 24);
      return new OkResponse(
        { decodedToken, user },
        'User verified successfully',
      );
    } catch (error) {
      console.log('ERROR: ', error);
      if (error instanceof Error) {
        return new BadRequestResponse(error.message);
      }
      return new InternalServerErrorResponse();
    }
  }

  async createSessionCookie(accessToken: string) {
    try {
      const expiresIn = 60 * 60 * 24 * 14 * 1000;
      const sessionCookie = await this.firebaseService.createSessionCookie(
        accessToken,
        expiresIn,
      );
      return { sessionCookie, expiresIn };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getUserInfo(email: string): Promise<ApiResponse<User>> {
    try {
      console.log(email);
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) return new NotFoundResponse('User does not exist');

      return new OkResponse(user, 'User found');
    } catch (_error) {
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
