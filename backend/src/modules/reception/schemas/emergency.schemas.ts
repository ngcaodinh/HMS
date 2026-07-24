import { z } from 'zod';

export const createEmergencyBodySchema = z.object({
  gender: z.enum(['male', 'female']),
  emergencyReason: z
    .string()
    .min(10, 'INVALID_EMERGENCY_REASON')
    .max(500),
  doctorId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  chiefComplaint: z.string().max(500).optional(),
});

export const normalizeEmergencyIdentityBodySchema = z.object({
  expectedVersion: z.number().int().positive(),
  fullName: z.string().min(1).max(255),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['male', 'female']),
  phoneNumber: z.string().optional().nullable(),
  phoneNumberUnavailableReason: z.string().min(3).max(255).optional().nullable(),
  identityCardNumber: z.string().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  privacyNoticeAccepted: z.literal(true),
});
