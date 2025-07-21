import { Campaign } from '@prisma/client';
import { generateDtoClassFromType } from 'src/shared/utils/type-to-dto';

export const CampaignDto = generateDtoClassFromType<Campaign>(
  {
    id: '',
    name: '',
    createdAt: new Date(),
    ownerId: '',
    type: '',
    channel: '',
    deletedAt: new Date(),
  },
  'CampaignsDto',
);
