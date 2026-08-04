import { z } from 'zod';

import { patientDateOfBirthSchema } from './date-validation';

export const createEmergencyBodySchema = z.object({
  gender: z.enum(['male', 'female']),
  emergencyReason: z
    .string()
    .trim()
    .min(10, 'Lý do cấp cứu tối thiểu 10 ký tự')
    .max(500, 'Lý do cấp cứu tối đa 500 ký tự'),
  doctorId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  chiefComplaint: z.string().max(500, 'Lý do khám tối đa 500 ký tự').optional(),
});

export const normalizeEmergencyIdentityBodySchema = z.object({
  expectedVersion: z.number().int().positive(),
  fullName: z
    .string()
    .trim()
    .min(1, 'Họ và tên là bắt buộc')
    .max(255, 'Họ và tên tối đa 255 ký tự'),
  dateOfBirth: patientDateOfBirthSchema,
  gender: z.enum(['male', 'female']),
  phoneNumber: z.string().optional().nullable(),
  phoneNumberUnavailableReason: z
    .string()
    .trim()
    .min(3, 'Lý do không có SĐT phải có ít nhất 3 ký tự')
    .max(255, 'Lý do không có SĐT tối đa 255 ký tự')
    .optional()
    .nullable(),
  identityCardNumber: z.string().optional().nullable(),
  address: z.string().max(500, 'Địa chỉ tối đa 500 ký tự').optional().nullable(),
  privacyNoticeAccepted: z.literal(true),
});
