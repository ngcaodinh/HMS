import { z } from 'zod';

export const listInventoryQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  warehouseId: z.string().trim().optional(),
});

export const inventorySummaryQuerySchema = z.object({
  warehouseId: z.string().trim().optional(),
});

export const listStockMovementsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  medicineId: z.string().trim().optional(),
  movementType: z.enum(['receipt', 'prescription_sign', 'prescription_cancel', 'adjustment']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  to: z.coerce.date().optional(),
  warehouseId: z.string().trim().optional(),
});
