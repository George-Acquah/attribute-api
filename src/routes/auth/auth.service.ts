import { Prisma } from '@prisma/client';
import { ApiResponse } from 'src/shared/res/api.response';
import { FirebaseAdminService } from 'src/shared/services/firebase/firebase-admin.service';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { RedisService } from 'src/shared/services/redis/redis.service';
import { RedisKeyPrefixes } from 'src/shared/constants/redis.constants';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';
import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';
import {
  BadRequestResponse,
  OkResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  CreatedResponse,
} from 'src/shared/res/responses';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcrypt';
import { _ILoginUser } from 'src/shared/interfaces/users.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly selectLoginUserFields = {
    id: true,
    email: true,
    name: true,
    phone: true,
    avatarUrl: true,
    roles: {
      select: {
        role: {
          select: {
            name: true,
          },
        },
      },
    },
    createdAt: true,
    updatedAt: true,
  } as const;
  constructor(
    private prisma: PrismaService,
    private readonly firebaseService: FirebaseAdminService,
    private readonly redisService: RedisService,
    private readonly transaction: PrismaTransactionService,
  ) {}

  async authenticateUser(
    accessToken: string,
    expiresIn: number,
  ): Promise<ApiResponse<{ sessionCookie: string; user: _ILoginUser }>> {
    try {
      const decodedToken = await this.firebaseService.verifyToken(accessToken);
      if (!decodedToken || !decodedToken.email) {
        return new BadRequestResponse('Invalid token');
      }

      // Run upsert inside transaction service
      const user = await this.transaction.run((tx) =>
        this.upsertUserWithProvider(
          tx,
          {
            email: decodedToken.email,
            uid: decodedToken.uid,
            name: decodedToken.name || '',
            avatarUrl: decodedToken.picture,
            provider: 'firebase',
            providerId: decodedToken.uid,
          },
          this.selectLoginUserFields,
        ),
      );

      const sessionCookie = await this.firebaseService.createSessionCookie(
        accessToken,
        expiresIn,
      );

      // Store session in Redis (scoped to UID, so only one session per Firebase user)
      const redisKey = `${RedisKeyPrefixes.FIREBASE_SESSION}:${decodedToken.uid}`;
      await this.redisService.set(redisKey, sessionCookie, expiresIn / 1000);

      const loginUser: _ILoginUser = {
        ...user,
        roles: user.roles.map((r) => r.role.name),
      };

      return new OkResponse(
        {
          sessionCookie,
          user: loginUser,
        },
        'Authenticated successfully',
      );
    } catch (error) {
      this.logger.error('authenticateUser error:', error);

      if (
        error?.errorInfo?.code === 'auth/id-token-expired' ||
        (error instanceof Error &&
          'code' in error &&
          (error as any).code === 'auth/id-token-expired')
      ) {
        return new ForbiddenResponse(
          'Your session has expired. Please log in again.',
        );
      }

      if (
        error instanceof Error &&
        'code' in error &&
        (error as any).code.startsWith('auth/')
      ) {
        return new ForbiddenResponse('Make sure you passed the correct JWT.');
      }

      return new InternalServerErrorResponse();
    }
  }

  async getUserInfo(email: string): Promise<ApiResponse<_ILoginUser>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: this.selectLoginUserFields,
      });

      if (!user) return new NotFoundResponse('User does not exist');
      const loginUser: _ILoginUser = {
        ...user,
        roles: user.roles.map((r) => r.role.name),
      };

      return new OkResponse(loginUser, 'User found');
    } catch (error) {
      this.logger.error('getUserInfo error:', error);
      return new InternalServerErrorResponse();
    }
  }

  async registerWithCredentials(email: string, name: string, password: string) {
    try {
      if (!email || !password)
        return new BadRequestResponse('Missing credentials');

      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) return new BadRequestResponse('User already exists');

      const hash = await bcrypt.hash(password, 12);

      // Use transaction service instead of prisma.$transaction
      const created = await this.transaction.run((tx) =>
        this.upsertUserWithProvider(
          tx,
          {
            email,
            name,
            passwordHash: hash,
            provider: 'local',
            providerId: email,
          },
          this.selectLoginUserFields,
        ),
      );

      const user: _ILoginUser = {
        ...created,
        roles: created.roles.map((r) => r.role.name),
      };

      return new CreatedResponse(user, 'User registered successfully');
    } catch (error) {
      this.logger.error('registerWithCredentials error', error);
      return new InternalServerErrorResponse();
    }
  }

  async loginWithCredentials(
    email: string,
    password: string,
  ): Promise<ApiResponse<{ sessionCookie: string; user: _ILoginUser }>> {
    try {
      if (!email || !password)
        return new BadRequestResponse('Missing credentials');
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { ...this.selectLoginUserFields, passwordHash: true },
      });
      if (!user || !user.passwordHash)
        return new ForbiddenResponse('Invalid credentials');

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return new ForbiddenResponse('Invalid credentials');

      const { token } = await this.createSessionForUser(user.id);

      const { passwordHash: _, ...sanitizedUser } = user;
      void _;
      return new OkResponse(
        {
          sessionCookie: token,
          user: {
            ...sanitizedUser,
            roles: user.roles.map((r) => r.role.name),
          },
        },
        'Logged in successfully',
      );
    } catch (error) {
      this.logger.error('loginWithCredentials error', error);
      return new InternalServerErrorResponse();
    }
  }

  async revokeTokens(
    { type, token: sessionToken }: _ISessionCookie,
    uid: string,
  ): Promise<ApiResponse<null>> {
    try {
      if (type === 'firebase') {
        const decodedClaims = await this.firebaseService.verifySessionCookie(
          sessionToken,
        );

        await this.firebaseService.removeRefreshTokens(decodedClaims.sub);

        const firebaseSessionKey = `${RedisKeyPrefixes.FIREBASE_SESSION}${uid}`;
        const userDataKey = `${RedisKeyPrefixes.SESSION_USER_KEY}${uid}`;

        await Promise.all([
          this.redisService.del(firebaseSessionKey),
          this.redisService.del(userDataKey),
        ]);
      } else {
        // ✅ Custom session — delete session and user data from Redis
        const customSessionKey = `${RedisKeyPrefixes.CUSTOM_SESSION}:${sessionToken}`;
        const userDataKey = `${RedisKeyPrefixes.SESSION_USER_KEY}${uid}`;

        await Promise.all([
          this.redisService.del(customSessionKey),
          this.redisService.del(userDataKey),
        ]);
      }

      return new OkResponse(null);
    } catch (_error) {
      return new InternalServerErrorResponse();
    }
  }

  private async upsertUserWithProvider<T extends Prisma.UserSelect>(
    tx: Prisma.TransactionClient,
    data: {
      email: string;
      name?: string;
      uid?: string | null;
      avatarUrl?: string | null;
      passwordHash?: string | null;
      provider: 'local' | 'firebase';
      providerId: string;
    },
    selectFields: T,
  ) {
    const defaultRole = await tx.role.findUnique({
      where: { name: 'user' },
    });
    if (!defaultRole) throw new Error('Default role not found');

    const user = await tx.user.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        uid: data.uid || null,
        name: data.name || '',
        avatarUrl: data.avatarUrl || null,
        passwordHash: data.passwordHash || null,
        roles: { create: [{ role: { connect: { id: defaultRole.id } } }] },
        authProviders: {
          create: [{ provider: data.provider, providerId: data.providerId }],
        },
      },
      update: {
        name: data.name || '',
        avatarUrl: data.avatarUrl || null,
        authProviders: {
          connectOrCreate: {
            where: {
              provider_providerId: {
                provider: data.provider,
                providerId: data.providerId,
              },
            },
            create: {
              provider: data.provider,
              providerId: data.providerId,
            },
          },
        },
      },
      select: selectFields,
    });

    // Type Prisma infers automatically based on the select
    return user as unknown as Prisma.UserGetPayload<{
      select: T;
    }>;
  }

  private async createSessionForUser(
    userId: string,
    ttlSeconds = 60 * 60 * 24 * 7,
  ) {
    const token = nanoid(48);
    const redisKey = `${RedisKeyPrefixes.CUSTOM_SESSION}:${token}`;
    await this.redisService.set(
      redisKey,
      { userId, createdAt: new Date().toISOString() },
      ttlSeconds,
    );
    return { token, ttlSeconds };
  }
}
