import { z } from 'zod';

export const attachmentIdParamsSchema = z.object({ attachmentId: z.string().min(1) });
