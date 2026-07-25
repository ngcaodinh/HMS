import { z } from 'zod';

export const roleCodeSchema = z.enum([
  'receptionist',
  'accountant',
  'doctor',
  'nurse',
  'lab_tech',
  'pharmacist',
]);

export const departmentSchema = z.enum([
  'clinical',
  'dermatology',
  'laboratory',
  'pharmacy',
  'accounting',
  'reception',
  'it',
]);

export const staffUserSchema = z.object({
  authVersion: z.number(),
  createdAt: z.string(),
  dateOfBirth: z.string(),
  departmentId: z.string(),
  fullName: z.string(),
  gender: z.enum(['male', 'female']),
  id: z.string(),
  identityCardNumber: z.string(),
  isActive: z.boolean(),
  lastLoginAt: z.string().nullable(),
  mustChangePassword: z.boolean(),
  phoneNumber: z.string(),
  roleCodes: z.array(z.string()),
  updatedAt: z.string(),
  username: z.string(),
});

export const staffListSchema = z.object({
  items: z.array(staffUserSchema),
  page: z.number(),
  pageSize: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export const createStaffResultSchema = z.object({
  temporaryPassword: z.string(),
  user: staffUserSchema,
});

export type StaffUser = z.infer<typeof staffUserSchema>;
export type StaffList = z.infer<typeof staffListSchema>;
export type CreateStaffResult = z.infer<typeof createStaffResultSchema>;
export type DepartmentCode = z.infer<typeof departmentSchema>;
export type ManagedRoleCode = z.infer<typeof roleCodeSchema>;
