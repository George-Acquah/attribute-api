import { Global } from '@nestjs/common/decorators/modules/global.decorator';
import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { SessionVerifierService } from '../services/common/session-verifier.service';
import { UsersModule } from 'src/routes/users/users.module';

@Global()
@Module({
  imports: [UsersModule],
  providers: [SessionVerifierService],
  exports: [SessionVerifierService],
})
export class SessionProviderModule {}
