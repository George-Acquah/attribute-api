import { AttributionService } from './attribution.service';
import { AttributionController } from './attribution.controller';
import { UsersModule } from '../users/users.module';
import { Module } from '@nestjs/common/decorators/modules/module.decorator';

@Module({
  imports: [UsersModule],
  controllers: [AttributionController],
  providers: [AttributionService],
  exports: [AttributionService],
})
export class AttributionModule {}
