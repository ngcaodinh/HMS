import { z } from 'zod';

import {
  IDENTITY_CARD_REGEX,
  VN_MOBILE_PHONE_REGEX,
} from '../../patients/constants/patient.constants';
import { patientDateOfBirthSchema } from './date-validation';

const newPatientSchema = z
  .object({
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
    healthInsuranceCode: z.string().max(20, 'Mã thẻ BHYT tối đa 20 ký tự').optional().nullable(),
    healthInsuranceExpiryDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày hết hạn BHYT phải theo định dạng YYYY-MM-DD')
      .optional()
      .nullable(),
    privacyNoticeAccepted: z.literal(true),
  })
  .superRefine((value, ctx) => {
    const phone = value.phoneNumber?.trim();
    if (phone) {
      if (!VN_MOBILE_PHONE_REGEX.test(phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Số điện thoại phải gồm 10 chữ số đầu di động Việt Nam hợp lệ',
          path: ['phoneNumber'],
        });
      }
    } else if (!value.phoneNumberUnavailableReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bắt buộc nhập số điện thoại hoặc lý do không có SĐT',
        path: ['phoneNumber'],
      });
    }

    const cccd = value.identityCardNumber?.trim();
    if (cccd && !IDENTITY_CARD_REGEX.test(cccd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Căn cước công dân phải đủ 12 chữ số',
        path: ['identityCardNumber'],
      });
    }
  });

export const createReceptionBodySchema = z
  .object({
    queueTicketId: z.string().uuid().optional(),
    doctorId: z.string().uuid(),
    departmentId: z.string().uuid().optional(),
    consultationServiceId: z.string().uuid().optional(),
    existingPatientId: z.string().uuid().optional(),
    newPatient: newPatientSchema.optional(),
    chiefComplaint: z.string().max(500, 'Lý do khám tối đa 500 ký tự').optional(),
  })
  .superRefine((value, ctx) => {
    const hasExisting = Boolean(value.existingPatientId);
    const hasNew = Boolean(value.newPatient);
    if (hasExisting === hasNew) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Đúng một trong existingPatientId | newPatient',
        path: ['existingPatientId'],
      });
    }

    if (!value.queueTicketId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Thiếu số thứ tự hàng đợi',
        path: ['queueTicketId'],
      });
    }
  });
