import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAdminService } from '../services/firebase/firebase-admin.service';
import { FirebaseAdminProvider } from '../providers/firebase-admin.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    // {
    //   provide: 'FIREBASE_ADMIN',
    //   inject: [ConfigService],
    //   useFactory: async (configService: ConfigService) => {
    //     const app = process.env.FIREBASE_AUTH_EMULATOR_HOST
    //       ? admin.initializeApp({ projectId: 'demo-project' })
    //       : admin.initializeApp({
    //           credential: admin.credential.cert({
    //             projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
    //             clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
    //             privateKey: configService
    //               .get<string>('FIREBASE_PRIVATE_KEY')
    //               ?.replace(/\\n/g, '\n'),
    //           }),
    //         });
    //     return app;
    //   },
    // },
    FirebaseAdminProvider,
    FirebaseAdminService,
  ],
  exports: [FirebaseAdminService],
})
export class FirebaseAdminModule {}
