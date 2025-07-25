import { ConversionType } from '@prisma/client';

export interface _ICreateConversion {
  type: ConversionType;

  value?: number;
  fingerprint?: string;

  userId: string;
}
