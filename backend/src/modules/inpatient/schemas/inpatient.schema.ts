import { z } from 'zod';

export const assignBedSchema = z.object({
  bedId: z.string().min(1, 'Mã giường không được để trống'),
  expectedRecordVersion: z.number().int('Version phải là số nguyên'),
  note: z.string().max(255, 'Ghi chú không quá 255 ký tự').optional(),
});

export const changeBedAssignmentSchema = z.object({
  targetBedId: z.string().optional(),
  expectedRecordVersion: z.number().int('Version phải là số nguyên'),
  action: z.enum(['transfer', 'correction'], {
    errorMap: () => ({ message: 'Hành động phải là transfer hoặc correction' }),
  }),
  reason: z.string().min(10, 'Lý do tối thiểu 10 ký tự').max(255, 'Lý do tối đa 255 ký tự'),
  note: z.string().max(255, 'Ghi chú không quá 255 ký tự').optional(),
});

export const signDischargeSummarySchema = z.object({
  dischargeDiagnosis: z.string().min(1, 'Chẩn đoán ra viện không được để trống').max(500),
  treatmentSummary: z.string().min(1, 'Tóm tắt điều trị không được để trống').max(2000),
  dischargeCondition: z.string().min(1, 'Tình trạng ra viện không được để trống').max(500),
  signatureConfirmation: z.literal(true, {
    errorMap: () => ({ message: 'Xác nhận chữ ký ký tên phải là true' }),
  }),
  icd10: z.string().max(10).optional(),
  doctorAdvice: z.string().max(2000).optional(),
  followUpDate: z.coerce.date().optional(),
});

export const dischargePatientSchema = z.object({
  expectedRecordVersion: z.number().int('Version phải là số nguyên'),
  dischargeConfirmation: z.literal(true, {
    errorMap: () => ({ message: 'Xác nhận xuất viện phải là true' }),
  }),
});

export const createOrderSchema = z.object({
  orderType: z.enum(['medication', 'monitoring', 'care', 'diet', 'procedure'], {
    errorMap: () => ({ message: 'Loại y lệnh không hợp lệ' }),
  }),
  content: z.string().min(1, 'Nội dung y lệnh không được để trống').max(1000),
  note: z.string().max(500).optional(),
});

export const completeOrderSchema = z.object({
  executedAt: z.coerce.date().optional(),
  note: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['done', 'cancelled', 'delayed', 'active'], {
    errorMap: () => ({ message: 'Trạng thái y lệnh không hợp lệ' }),
  }),
  cancelReason: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  cancelReason: z.string().min(1, 'Lý do hủy y lệnh không được để trống').max(500),
});
