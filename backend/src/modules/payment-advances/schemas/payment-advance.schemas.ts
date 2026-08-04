import { z } from 'zod';

const amountVndSchema = z.coerce
  .number({ invalid_type_error: 'Số tiền tạm ứng không hợp lệ.' })
  .int('Số tiền tạm ứng phải là số nguyên.')
  .positive('Số tiền tạm ứng phải lớn hơn 0.')
  .max(Number.MAX_SAFE_INTEGER, 'Số tiền tạm ứng vượt quá giới hạn cho phép.');

const methodSchema = z.enum(['cash', 'momo'], {
  errorMap: () => ({ message: 'Phương thức tạm ứng không hợp lệ.' }),
});

export const recordIdParamSchema = z.object({
  recordId: z.string().uuid(),
});

export const createPaymentAdvanceBodySchema = z.object({
  amountVnd: amountVndSchema,
  method: methodSchema,
  reason: z.string().trim().max(500).optional(),
});

export const createRefundBodySchema = z.object({
  amountVnd: amountVndSchema,
  reason: z.string().trim().min(10, 'Lý do hoàn trả phải tối thiểu 10 ký tự.').max(500),
});

export const listPaymentAdvancesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
