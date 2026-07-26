import { z } from 'zod';

export const recordIdParamsSchema = z.object({ recordId: z.string().min(1) });
export const prescriptionIdParamsSchema = z.object({ prescriptionId: z.string().min(1) });
export const idempotencyKeySchema = z.string().uuid();

export const medicineQuerySchema = z.object({ keyword: z.string().optional() });

const prescriptionItemSchema = z.object({
  medicineId: z.string().min(1),
  quantity: z.number().int().positive(),
  days: z.number().int().min(1).max(90),
  dosePerUse: z.string().max(50).optional(),
  usesPerDay: z.number().int().positive().optional(),
  useTiming: z.string().max(100).optional(),
  dosageInstruction: z.string().min(1).max(500),
});

export const createPrescriptionDraftSchema = z.object({
  expectedRecordVersion: z.number().int().positive(),
  prescriptionType: z.enum(['C', 'N', 'H']).optional(),
  items: z.array(prescriptionItemSchema).max(20),
  noDrugConfirmation: z.boolean().optional(),
  longTermReason: z.string().optional(),
  allergyOverrideReason: z.string().optional(),
});

export const signPrescriptionSchema = z.object({
  expectedVersion: z.number().int().positive(),
  signatureConfirmation: z.literal(true),
  signatureMethod: z.literal('dev_e_confirmation'),
  allergyOverrideReason: z.string().optional(),
});

export const cancelPrescriptionSchema = z.object({
  expectedVersion: z.number().int().positive(),
  cancelReason: z.string().min(1).max(500),
});

export const exportPrescriptionXmlSchema = z.object({
  expectedVersion: z.number().int().positive(),
});

export const listDispensablePrescriptionsQuerySchema = z.object({
  keyword: z.string().optional(),
  warehouseId: z.string().trim().optional(),
  // z.coerce.boolean() would coerce the literal string "false" to `true` — match the string instead.
  dispensed: z.enum(['true', 'false']).optional().transform((value) => value === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const dispensePrescriptionSchema = z.object({
  expectedVersion: z.number().int().positive(),
  dispenseConfirmation: z.literal(true),
});
