import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { AppError } from '../../../core/errors/app-error';
import { findAttachmentById } from '../repositories/attachment.repository';

/**
 * @route GET /api/v1/attachments/:attachmentId/file
 * @desc Streams the raw file content — never exposes the local filesystem path or a public URL.
 * Upload is intentionally not ported onto this branch (doctor Tab 3 only reads results already
 * recorded by the lab_tech module).
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
