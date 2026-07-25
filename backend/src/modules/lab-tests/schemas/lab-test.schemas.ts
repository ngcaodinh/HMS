import { z } from 'zod';

export const labTestIdParamsSchema = z.object({ labTestId: z.string().min(1) });
