import { InteractionType } from '@prisma/client';
// ...existing imports...

export interface IAttributeInteraction {
  phoneNumber?: string;
  email?: string;

  codeId: string;
  userMetadata?: Record<string, unknown>;
  type?: InteractionType;
}
