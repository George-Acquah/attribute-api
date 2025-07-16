import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { IFirebaseConfig } from '../interfaces/firebase.interface';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

export const FirebaseAdminProvider: Provider = {
  provide: FIREBASE_ADMIN,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const firebaseAdminConfig: IFirebaseConfig = {
      projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
      clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
      privateKey: configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n'),
    };
    const app = process.env.FIREBASE_AUTH_EMULATOR_HOST
      ? admin.initializeApp({ projectId: 'demo-project' })
      : admin.initializeApp({
          credential: admin.credential.cert(firebaseAdminConfig),
        });

    return app;
  },
};
