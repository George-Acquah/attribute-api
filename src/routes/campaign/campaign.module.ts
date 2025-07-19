import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { CaslAbilityFactory } from 'src/shared/providers/casl.provider';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [CampaignController],
  providers: [CampaignService, PaginationService, CaslAbilityFactory],
})
export class CampaignModule {}
