import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../core/errors/app-error';
import { downloadAttachmentFile } from '../services/attachment.service';

function requirePrincipal(req: Request) {
  if (!req.principal) throw AppError.unauthorized('UNAUTHENTICATED', 'Không xác thực được người dùng.');
  return req.principal;
}

/**
 * @route GET /api/v1/attachments/:attachmentId/file
 * @desc Binary download — returns the raw file, not the JSON envelope.
 * @access doctor, lab_tech, pharmacist
 */
export async function downloadAttachmentFileController(req: Request, res: Response, next: NextFunction) {
  try {
    requirePrincipal(req);
    const { attachmentId } = req.params as { attachmentId: string };
    const { content, mimeType, originalName, checksumSha256 } = await downloadAttachmentFile(attachmentId);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('X-Content-SHA256', checksumSha256);
    res.status(200).send(content);
  } catch (error) {
    next(error);
  }
}
