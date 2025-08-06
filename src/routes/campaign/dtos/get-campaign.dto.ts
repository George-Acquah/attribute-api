import { Campaign } from '@prisma/client';
import { generateDtoClassFromType } from 'src/shared/utils/type-to-dto';

export interface _ICampaignAnalytics {
  campaignId: string;
  totalInteractions: number;
  totalConversions: number;
  conversionRate: number;
  codes: Array<{
    code: string;
    interactions: number;
    conversions: number;
    conversionRate: number;
  }>;
}

export const CampaignDto = generateDtoClassFromType<Campaign>(
  {
    id: '',
    name: '',
    createdAt: new Date(),
    ownerId: '',
    medium: '',
    deletedAt: new Date(),
    description: '',
    budget: 0,
    target: '',
    actions: [],
    endDate: new Date(),
    channelId: '',
    regionId: '',
    startDate: new Date(),
  },
  'CampaignsDto',
);

export const CampaignAnalyticsDto =
  generateDtoClassFromType<_ICampaignAnalytics>(
    {
      campaignId: '',
      totalInteractions: 0,
      totalConversions: 0,
      conversionRate: 0,
      codes: [],
    },
    'CampaignAnalytics',
  );
