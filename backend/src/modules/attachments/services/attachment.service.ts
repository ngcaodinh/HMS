import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { AppError } from '../../../core/errors/app-error';
import { config } from '../../../config/unified-config';
import {
  createAttachment,
  findAttachmentById,
  verifyOwnerExists,
} from '../repositories/attachment.repository';
import type { AttachmentOwnerType } from '../types/attachment.types';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MIN_FILE_SIZE_BYTES = 1;

const MIME_TO_FILE_TYPE: Record<string, 'pdf' | 'png' | 'jpeg'> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpeg',
};

/**
 * @route POST /api/v1/attachments
 * @desc Validates MIME/size, writes the file under the server-only upload root, records SHA-256
 * for later integrity checks. The client never controls filePath/checksumSha256/uploadedBy.
 * @access doctor, lab_tech, pharmacist
 * @throws {AppError} 400 INVALID_FILE_TYPE, 413 PAYLOAD_TOO_LARGE, 404 ATTACHMENT_OWNER_NOT_FOUND
 */
export async function uploadAttachment(
  file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  ownerType: AttachmentOwnerType,
  ownerId: string,
  uploadedBy: string,
) {
  const fileType = MIME_TO_FILE_TYPE[file.mimetype];
  if (!fileType) {
    throw AppError.badRequest('INVALID_FILE_TYPE', 'Chỉ chấp nhận tệp PDF, PNG hoặc JPEG.');
  }
  if (file.size < MIN_FILE_SIZE_BYTES || file.size > MAX_FILE_SIZE_BYTES) {
    throw AppError.payloadTooLarge('PAYLOAD_TOO_LARGE', 'Kích thước tệp phải từ 1 byte đến 10MB.');
  }

  const ownerExists = await verifyOwnerExists(ownerType, ownerId);
  if (!ownerExists) {
    throw AppError.notFound('ATTACHMENT_OWNER_NOT_FOUND', 'Không tìm thấy đối tượng sở hữu tệp đính kèm.');
  }

  const checksumSha256 = createHash('sha256').update(file.buffer).digest('hex');
  const id = randomUUID();
  const dir = path.join(config.upload.root, 'attachments', ownerType);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${id}-${file.originalname}`);
  await writeFile(filePath, file.buffer);

  const attachment = await createAttachment({
    id,
    ownerType,
    ownerId,
    filePath,
    fileType,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: BigInt(file.size),
    checksumSha256,
    uploadedBy,
  });

  return {
    attachmentId: attachment.id,
    ownerType: attachment.ownerType,
    ownerId: attachment.ownerId,
    fileType: attachment.fileType,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes.toString(),
    checksumSha256: attachment.checksumSha256,
    uploadedAt: attachment.uploadedAt,
  };
}

/**
 * @route GET /api/v1/attachments/:attachmentId/file
 * @desc Streams the raw file content — never exposes the local filesystem path or a public URL.
 * @access doctor, lab_tech, pharmacist
 * @throws {AppError} 404 ATTACHMENT_NOT_FOUND, 409 ATTACHMENT_INTEGRITY_ERROR
 */
export async function downloadAttachmentFile(attachmentId: string) {
  const attachment = await findAttachmentById(attachmentId);
  if (!attachment) {
    throw AppError.notFound('ATTACHMENT_NOT_FOUND', 'Không tìm thấy tệp đính kèm.');
  }

  const content = await readFile(attachment.filePath);
  const checksumSha256 = createHash('sha256').update(content).digest('hex');
  if (checksumSha256 !== attachment.checksumSha256) {
    throw AppError.conflict('ATTACHMENT_INTEGRITY_ERROR', 'Tệp đính kèm đã bị thay đổi hoặc hỏng.');
  }

  return { content, mimeType: attachment.mimeType, originalName: attachment.originalName, checksumSha256 };
}
