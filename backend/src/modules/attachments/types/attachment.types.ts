import type { attachments_ownerType } from '@prisma/client';

export type AttachmentOwnerType = attachments_ownerType;

export interface UploadAttachmentInput {
  ownerType: AttachmentOwnerType;
  ownerId: string;
}
