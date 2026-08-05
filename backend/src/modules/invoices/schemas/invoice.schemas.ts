import { z } from 'zod';

/** Kiểm tra chuỗi ngày có đúng ngày lịch UTC hay chỉ là ngày được Date tự chuẩn hóa. */
function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

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

    if (data.healthInsuranceBenefitLevel === 'NO_COVERAGE' && data.healthInsuranceRouteType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Không được gửi tuyến BHYT khi không hưởng BHYT',
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
  cancelReason: z.string().trim().min(10, 'Lý do hủy phải tối thiểu 10 ký tự.').max(500),
});

export const listInvoiceCandidatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const accountingReportQuerySchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .superRefine((data, ctx) => {
    if (!isValidCalendarDate(data.from)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ngày bắt đầu báo cáo không hợp lệ',
        path: ['from'],
      });
    }

    if (!isValidCalendarDate(data.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ngày kết thúc báo cáo không hợp lệ',
        path: ['to'],
      });
    }

    if (data.from > data.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Khoảng ngày báo cáo không hợp lệ',
        path: ['to'],
      });
    }
  });

export const writeOffInvoiceBodySchema = z.object({
  expectedVersion: z.number().int().positive(),
  writeOffReason: z.string().trim().min(10, 'Lý do miễn giảm phải tối thiểu 10 ký tự.').max(500),
});
