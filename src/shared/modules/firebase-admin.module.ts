import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAdminService } from '../services/firebase/firebase-admin.service';
import { FirebaseAdminProvider } from '../providers/firebase-admin.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [FirebaseAdminProvider, FirebaseAdminService],
  exports: [FirebaseAdminService],
})
export class FirebaseAdminModule {}
