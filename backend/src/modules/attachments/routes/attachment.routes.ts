import { Router } from 'express';
import multer from 'multer';

import { validateRequest } from '../../../core/http/validate-request';
import { authorizeAndAudit } from '../../../middlewares/authorize-and-audit';
import {
  downloadAttachmentFileController,
  uploadAttachmentController,
} from '../controllers/attachment.controller';
import { attachmentIdParamsSchema, uploadAttachmentBodySchema } from '../schemas/attachment.schemas';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const attachmentRouter = Router();

attachmentRouter.post(
  '/',
  authorizeAndAudit('attachment.upload'),
  upload.single('file'),
  validateRequest({ body: uploadAttachmentBodySchema }),
  uploadAttachmentController,
);

attachmentRouter.get(
  '/:attachmentId/file',
  authorizeAndAudit('attachment.download'),
  validateRequest({ params: attachmentIdParamsSchema }),
  downloadAttachmentFileController,
);
