import { prisma } from '../../../core/db/prisma-client';
import type { AttachmentOwnerType } from '../types/attachment.types';

export function findAttachmentById(attachmentId: string) {
  return prisma.attachments.findUnique({ where: { id: attachmentId } });
}

/** Confirms the polymorphic owner row actually exists before a file is written to disk. */
export async function verifyOwnerExists(ownerType: AttachmentOwnerType, ownerId: string): Promise<boolean> {
  switch (ownerType) {
    case 'medical_record':
      return Boolean(await prisma.medical_records.findUnique({ where: { id: ownerId }, select: { id: true } }));
    case 'lab_test':
      return Boolean(await prisma.lab_tests.findUnique({ where: { id: ownerId }, select: { id: true } }));
    case 'prescription':
      return Boolean(await prisma.prescriptions.findUnique({ where: { id: ownerId }, select: { id: true } }));
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
  return prisma.attachments.create({ data });
}
