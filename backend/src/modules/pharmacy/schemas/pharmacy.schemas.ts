import { z } from 'zod';

export const listInventoryQuerySchema = z.object({
  keyword: z.string().trim().max(100, 'Từ khóa tối đa 100 ký tự.').optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  warehouseId: z.string().uuid('Mã kho không hợp lệ.').optional(),
});

export const inventorySummaryQuerySchema = z.object({
  warehouseId: z.string().uuid('Mã kho không hợp lệ.').optional(),
});

export const listStockMovementsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  medicineId: z.string().uuid('Mã thuốc không hợp lệ.').optional(),
  movementType: z.enum(['receipt', 'prescription_sign', 'prescription_cancel', 'adjustment']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  to: z.coerce.date().optional(),
  warehouseId: z.string().uuid('Mã kho không hợp lệ.').optional(),
}).superRefine((value, context) => {
  if (value.from && value.to && value.from > value.to) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['from'],
      message: 'Khoảng thời gian không hợp lệ (từ ngày phải trước đến ngày).',
    });
  }
});
