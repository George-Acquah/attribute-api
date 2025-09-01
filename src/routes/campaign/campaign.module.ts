import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { CaslAbilityFactory } from 'src/shared/providers/casl.provider';
import { UsersModule } from '../users/users.module';
import { CacheService } from 'src/shared/services/redis/cache.service';

@Module({
  imports: [UsersModule],
  controllers: [CampaignController],
  providers: [
    CampaignService,
    PaginationService,
    CaslAbilityFactory,
    CacheService,
  ],
})
export class CampaignModule {}
