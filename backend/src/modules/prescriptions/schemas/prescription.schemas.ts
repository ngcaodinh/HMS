import { z } from 'zod';

export const recordIdParamsSchema = z.object({ recordId: z.string().min(1) });
export const prescriptionIdParamsSchema = z.object({ prescriptionId: z.string().min(1) });
export const idempotencyKeySchema = z.string().uuid();

export const medicineQuerySchema = z.object({ keyword: z.string().optional() });

const prescriptionItemSchema = z.object({
  medicineId: z.string().min(1, 'Vui lòng chọn thuốc.'),
  quantity: z
    .number()
    .int('Số lượng phải là số nguyên.')
    .positive('Số lượng phải là số nguyên dương.'),
  days: z
    .number()
    .int('Số ngày dùng phải là số nguyên.')
    .min(1, 'Số ngày dùng tối thiểu là 1 ngày.')
    .max(90, 'Số ngày dùng tối đa là 90 ngày.'),
  dosePerUse: z
    .string()
    .trim()
    .min(1, 'Liều dùng không được để trống.')
    .max(50, 'Liều dùng không được vượt quá 50 ký tự.'),
  usesPerDay: z
    .number()
    .int('Số lần dùng mỗi ngày phải là số nguyên.')
    .positive('Số lần dùng mỗi ngày phải lớn hơn 0.')
    .optional(),
  useTiming: z
    .string()
    .trim()
    .min(1, 'Thời điểm dùng không được để trống.')
    .max(100, 'Thời điểm dùng không được vượt quá 100 ký tự.'),
  dosageInstruction: z
    .string()
    .min(1, 'Cách dùng thuốc không được để trống.')
    .max(500, 'Cách dùng thuốc không được vượt quá 500 ký tự.')
    .refine((value) => value.replace(/[\s,]/g, '').length > 0, 'Cách dùng thuốc không hợp lệ.'),
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
  dispensed: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const dispensePrescriptionSchema = z.object({
  expectedVersion: z.number().int().positive(),
  dispenseConfirmation: z.literal(true),
});
