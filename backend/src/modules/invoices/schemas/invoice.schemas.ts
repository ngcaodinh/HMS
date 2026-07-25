import { z } from 'zod';

export const createInvoiceBodySchema = z
  .object({
    recordId: z.string().uuid(),
    healthInsuranceBenefitLevel: z.enum(['NO_COVERAGE', 'RATE_80', 'RATE_95', 'RATE_100']),
    healthInsuranceRouteType: z
      .enum(['right_route', 'referral', 'emergency', 'wrong_route'])
      .optional(),
    statementIssueRequested: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.healthInsuranceBenefitLevel !== 'NO_COVERAGE' && !data.healthInsuranceRouteType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'healthInsuranceRouteType bắt buộc khi có mức hưởng BHYT',
        path: ['healthInsuranceRouteType'],
      });
    }
  });

export const invoiceIdParamSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const listInvoicesQuerySchema = z.object({
  recordId: z.string().uuid().optional(),
  status: z.enum(['pending', 'paid', 'cancelled', 'write_off']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const cancelInvoiceBodySchema = z.object({
  expectedVersion: z.number().int().positive(),
  cancelReason: z.string().min(1).max(500),
});
