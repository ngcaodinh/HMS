import { z } from 'zod';

export const invoiceIdParamSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const cashPaymentBodySchema = z.object({
  paidAt: z.string().optional(),
});

export const momoPaymentRequestBodySchema = z.object({
  returnUrl: z.string().url().optional(),
});

export const idempotencyKeySchema = z.string().uuid();
