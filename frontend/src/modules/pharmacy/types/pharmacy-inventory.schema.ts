import { z } from 'zod';

export const warehouseSummarySchema = z.object({
  code: z.string(),
  name: z.string(),
  warehouseId: z.string(),
});

const medicineSummarySchema = z.object({
  activeIngredient: z.string().nullable(),
  code: z.string().nullable(),
  coveredByHealthInsurance: z.boolean(),
  dosage: z.string().nullable(),
  medicineId: z.string(),
  name: z.string(),
  unit: z.string(),
});

export const pharmacyInventoryBatchSchema = z.object({
  batchId: z.string(),
  batchNumber: z.string(),
  daysToExpiry: z.number().int(),
  expiryDate: z.string(),
  importPrice: z.string(),
  isExpired: z.boolean(),
  isExpiringSoon: z.boolean(),
  isLowStock: z.boolean(),
  medicine: medicineSummarySchema,
  quantity: z.number().int(),
  version: z.number().int(),
  warehouse: warehouseSummarySchema,
});

export const pharmacyInventorySummarySchema = z.object({
  expiredBatches: z.number().int(),
  expiringSoonBatches: z.number().int(),
  lowStockBatches: z.number().int(),
  totalBatches: z.number().int(),
  totalQuantity: z.number().int(),
});

export const stockMovementTypeSchema = z.enum([
  'receipt',
  'prescription_sign',
  'prescription_cancel',
  'adjustment',
]);

export const pharmacyStockMovementSchema = z.object({
  actorUserId: z.string().nullable(),
  balanceAfter: z.number().int(),
  batch: z.object({
    batchId: z.string(),
    batchNumber: z.string(),
    expiryDate: z.string(),
  }),
  createdAt: z.string(),
  medicine: z.object({
    code: z.string().nullable(),
    medicineId: z.string(),
    name: z.string(),
  }),
  movementId: z.string(),
  movementType: stockMovementTypeSchema,
  prescriptionId: z.string().nullable(),
  quantityChange: z.number().int(),
  referenceId: z.string().nullable(),
  referenceType: z.string().nullable(),
  warehouse: warehouseSummarySchema,
});

export type PharmacyInventoryBatch = z.infer<typeof pharmacyInventoryBatchSchema>;
export type PharmacyInventorySummary = z.infer<typeof pharmacyInventorySummarySchema>;
export type PharmacyStockMovement = z.infer<typeof pharmacyStockMovementSchema>;
export type PharmacyWarehouse = z.infer<typeof warehouseSummarySchema>;
export type StockMovementType = z.infer<typeof stockMovementTypeSchema>;
