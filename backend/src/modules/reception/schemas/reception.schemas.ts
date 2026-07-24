import { z } from 'zod';

import {
  IDENTITY_CARD_REGEX,
  VN_MOBILE_PHONE_REGEX,
} from '../../patients/constants/patient.constants';

const newPatientSchema = z
  .object({
    fullName: z.string().min(1).max(255),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    gender: z.enum(['male', 'female']),
    phoneNumber: z.string().optional().nullable(),
    phoneNumberUnavailableReason: z.string().min(3).max(255).optional().nullable(),
    identityCardNumber: z.string().optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    healthInsuranceCode: z.string().max(20).optional().nullable(),
    healthInsuranceExpiryDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
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
          message: 'INVALID_PHONE_FORMAT',
          path: ['phoneNumber'],
        });
      }
    } else if (!value.phoneNumberUnavailableReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PHONE_REQUIRED',
        path: ['phoneNumber'],
      });
    }

    const cccd = value.identityCardNumber?.trim();
    if (cccd && !IDENTITY_CARD_REGEX.test(cccd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'INVALID_IDENTITY_CARD_FORMAT',
        path: ['identityCardNumber'],
      });
    }
  });

export const createReceptionBodySchema = z
  .object({
    queueTicketId: z.string().uuid().optional(),
    createDirectTicket: z.boolean().optional(),
    doctorId: z.string().uuid(),
    departmentId: z.string().uuid().optional(),
    consultationServiceId: z.string().uuid().optional(),
    existingPatientId: z.string().uuid().optional(),
    newPatient: newPatientSchema.optional(),
    chiefComplaint: z.string().max(500).optional(),
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

    if (!value.createDirectTicket && !value.queueTicketId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'QUEUE_TICKET_REQUIRED',
        path: ['queueTicketId'],
      });
    }
  });
