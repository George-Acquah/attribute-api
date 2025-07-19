import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { IFirebaseConfig } from '../interfaces/firebase.interface';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

export const FirebaseAdminProvider: Provider = {
  provide: FIREBASE_ADMIN,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const useEmulator = configService.get<string>(
      'FIREBASE_AUTH_EMULATOR_HOST',
    );

    if (useEmulator) {
      return admin.initializeApp({
        projectId:
          configService.get<string>('FIREBASE_PROJECT_ID') || 'demo-project',
      });
    }
    const requiredFields = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
    ];
    for (const field of requiredFields) {
      if (!configService.get(field)) {
        throw new Error(`Missing Firebase config: ${field}`);
      }
    }

    try {
      const firebaseAdminConfig: IFirebaseConfig = {
        projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
        clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        privateKey: configService
          .get<string>('FIREBASE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n'),
      };
      return admin.initializeApp({
        credential: admin.credential.cert(firebaseAdminConfig),
      });
    } catch (error) {
      throw new Error(`Firebase initialization failed: ${error.message}`);
    }
  },
};
