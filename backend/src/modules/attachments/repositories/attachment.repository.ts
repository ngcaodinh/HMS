import { prisma } from '../../../core/db/prisma-client';

export function findAttachmentById(attachmentId: string) {
  return prisma.attachments.findUnique({ where: { id: attachmentId } });
}
