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

export const recordVitalSignsSchema = z.object({
  ticketId: z.string().min(1, 'Thiếu số thứ tự đang gọi'),
  expectedRecordVersion: z.number().int('Version phải là số nguyên'),
  pulse: z.number().int().min(0).max(300),
  temperatureC: z.number().min(25).max(45).optional(),
  bloodPressureSystolic: z.number().int().min(0).max(300),
  bloodPressureDiastolic: z.number().int().min(0).max(300),
  respiratoryRate: z.number().int().min(0).max(120).optional(),
  spo2: z.number().int().min(0).max(100),
  heightCm: z.number().min(0).max(300).optional(),
  weightKg: z.number().min(0).max(500).optional(),
  allergies: z.string().max(1000).optional(),
});

export const standardizeEmergencyIdentitySchema = z.object({
  fullName: z.string().min(3, 'Họ và tên tối thiểu 3 ký tự').max(255, 'Họ và tên tối đa 255 ký tự'),
  dateOfBirth: z.coerce
    .date({ errorMap: () => ({ message: 'Ngày sinh không hợp lệ' }) })
    .refine((d) => d <= new Date(), 'Ngày sinh không được ở tương lai'),
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'Giới tính phải là male hoặc female' }),
  }),
  phoneNumber: z
    .string()
    .regex(
      /^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-9])[0-9]{7}$/,
      'Số điện thoại không đúng định dạng di động Việt Nam hợp lệ (VD: 09xxxxxxxx, 03xxxxxxxx)'
    ),
  identityCardNumber: z.string().regex(/^\d{12}$/, 'Số CCCD phải gồm đúng 12 chữ số'),
  address: z.string().max(500, 'Địa chỉ tối đa 500 ký tự').optional(),
  healthInsuranceCode: z.string().max(20, 'Mã thẻ BHYT tối đa 20 ký tự').optional(),
  guardianFullName: z
    .string()
    .min(1, 'Họ tên người bảo hộ / liên hệ không được để trống')
    .max(255, 'Họ tên người bảo hộ tối đa 255 ký tự'),
  privacyConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'Cần xác nhận đồng ý cung cấp thông tin và cam kết bảo mật' }),
  }),
});

