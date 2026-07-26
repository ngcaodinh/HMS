import type { AttachmentOwnerType as PrismaAttachmentOwnerType } from '@prisma/client';

export type AttachmentOwnerType = PrismaAttachmentOwnerType;

export interface UploadAttachmentInput {
  ownerType: AttachmentOwnerType;
  ownerId: string;
}
