import { z } from 'zod';

export const searchPatientsQuerySchema = z
  .object({
    fullName: z.string().min(1).max(255).optional(),
    phoneNumber: z.string().min(1).max(15).optional(),
    identityCardNumber: z.string().length(12).regex(/^\d{12}$/).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .superRefine((value, ctx) => {
    const keys = [value.fullName, value.phoneNumber, value.identityCardNumber].filter(
      (item) => item !== undefined && item !== '',
    );
    if (keys.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Đúng một trong fullName | phoneNumber | identityCardNumber',
        path: ['query'],
      });
    }
  });
