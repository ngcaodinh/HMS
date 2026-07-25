import { Router } from 'express';

import { validateRequest } from '../../../core/http/validate-request';
import { authorizeAndAudit } from '../../../middlewares/authorize-and-audit';
import { downloadAttachmentFileController } from '../controllers/attachment.controller';
import { attachmentIdParamsSchema } from '../schemas/attachment.schemas';

/** Mounted at /api/v1/attachments */
export const attachmentRouter = Router();

attachmentRouter.get(
  '/:attachmentId/file',
  authorizeAndAudit('attachment.download'),
  validateRequest({ params: attachmentIdParamsSchema }),
  downloadAttachmentFileController,
);
