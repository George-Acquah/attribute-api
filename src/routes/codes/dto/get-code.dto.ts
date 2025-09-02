import { Code } from '@prisma/client';
import { generateDtoClassFromType } from 'src/shared/utils/type-to-dto';

export const CodeDto = generateDtoClassFromType<Code>(
  {
    code: '',
    id: '',
    campaignId: '',
    createdAt: new Date(),
    deletedAt: new Date(),
    qrUrl: '',
    type: 'QR',
  },
  'CodeDto',
);
