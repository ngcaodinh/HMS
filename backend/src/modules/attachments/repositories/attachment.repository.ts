import { prisma } from '../../../core/db/prisma-client';
import type { AttachmentOwnerType } from '../types/attachment.types';

export function findAttachmentById(attachmentId: string) {
  return prisma.attachment.findUnique({ where: { id: attachmentId } });
}

/** Kiem tra owner da ton tai truoc khi cho phep ghi file len dia. */
export async function verifyOwnerExists(ownerType: AttachmentOwnerType, ownerId: string): Promise<boolean> {
  switch (ownerType) {
    case 'medical_record':
      return Boolean(await prisma.medicalRecord.findUnique({ where: { id: ownerId }, select: { id: true } }));
    case 'lab_test':
      return Boolean(await prisma.labTest.findUnique({ where: { id: ownerId }, select: { id: true } }));
    case 'prescription':
      return Boolean(await prisma.prescription.findUnique({ where: { id: ownerId }, select: { id: true } }));
    default:
      return false;
  }
}

export function createAttachment(data: {
  id: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
  filePath: string;
  fileType: 'pdf' | 'png' | 'jpeg' | 'xml';
  originalName: string;
  mimeType: string;
  sizeBytes: bigint;
  checksumSha256: string;
  uploadedBy: string;
}) {
  return prisma.attachment.create({ data });
}
