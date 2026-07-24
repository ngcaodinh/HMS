import { z } from 'zod';

export const createSessionSchema = z.object({
  username: z.string().regex(/^[A-Za-z0-9._]{3,50}$/, 'Mã nhân viên không hợp lệ.'),
  password: z.string().min(8).max(128),
});

export type CreateSessionBody = z.infer<typeof createSessionSchema>;
