import { Inject } from '@nestjs/common/decorators/core/inject.decorator';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { FirebaseAdmin } from 'src/shared/interfaces/firebase.interface';
import { FIREBASE_ADMIN } from 'src/shared/providers/firebase-admin.provider';

@Injectable()
export class FirebaseAdminService {
  constructor(@Inject(FIREBASE_ADMIN) private readonly app: FirebaseAdmin) {}

  async verifyToken(idToken: string): Promise<DecodedIdToken> {
    const decoded = await this.app.auth().verifyIdToken(idToken);
    return decoded;
  }

  async verifySessionCookie(sessionCookie: string) {
    return await this.app.auth().verifySessionCookie(sessionCookie, true);
  }

  async setCustomClaims(uid: string, dbUserId: string): Promise<void> {
    await this.app.auth().setCustomUserClaims(uid, {
      dbUserId,
    });
  }

  async createSessionCookie(accessToken: string, expiresIn: number) {
    return await this.app.auth().createSessionCookie(accessToken, {
      expiresIn,
    });
  }

  async removeRefreshTokens(sessionToken: string) {
    await this.app.auth().revokeRefreshTokens(sessionToken);
  }
}
