import { z } from 'zod';

export const attachmentIdParamsSchema = z.object({ attachmentId: z.string().min(1) });

/** Validated after multer parses the multipart body — fields arrive as plain strings. */
export const uploadAttachmentBodySchema = z.object({
  ownerType: z.enum(['medical_record', 'lab_test', 'prescription']),
  ownerId: z.string().min(1),
});
