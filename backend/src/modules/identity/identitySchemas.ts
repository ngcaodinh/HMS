import { z } from 'zod';

import { roleCodes } from './identityTypes';

/**
 * Các regex đầu vào cố định giúp route trả lỗi validation trước khi vào service.
 */
const phoneSchema = z.string().regex(/^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-9])[0-9]{7}$/);
const identityCardSchema = z.string().regex(/^[0-9]{12}$/);
const usernameSchema = z.string().trim().min(3).max(50).regex(/^[A-Za-z0-9._]+$/);
const roleCodeSchema = z.enum(roleCodes);

const getTodayDateValue = () => {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localTime.toISOString().slice(0, 10);
};

/**
 * Kiểm tra chuỗi ngày dạng DATE có thật và không vượt quá ngày hiện tại.
 */
const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh phải theo định dạng YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Ngày sinh không hợp lệ')
  .refine((value) => value <= getTodayDateValue(), 'Ngày sinh không được ở tương lai');

/**
 * Body đăng nhập nhân viên.
 */
export const createSessionSchema = z.object({
  password: z.string().min(1).max(200),
  username: usernameSchema,
});

/**
 * Body đổi mật khẩu với chính sách độ dài và độ phức tạp tối thiểu.
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200).optional(),
  newPassword: z
    .string()
    .min(10)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

/**
 * Body tạo tài khoản nhân viên do IT/admin thực hiện.
 */
export const createStaffSchema = z
  .object({
    dateOfBirth: dateOnlySchema,
    departmentId: z.string().min(1).max(36),
    fullName: z.string().trim().min(2).max(255),
    gender: z.enum(['male', 'female']),
    identityCardNumber: identityCardSchema,
    phoneNumber: phoneSchema,
    roleCodes: z.array(roleCodeSchema).min(1).max(1),
    username: usernameSchema,
  })
  .strict();

/**
 * Body cập nhật tài khoản; strict để chặn field ngoài hợp đồng API.
 */
export const updateStaffSchema = z
  .object({
    dateOfBirth: dateOnlySchema.optional(),
    departmentId: z.string().min(1).max(36).optional(),
    fullName: z.string().trim().min(2).max(255).optional(),
    gender: z.enum(['male', 'female']).optional(),
    identityCardNumber: identityCardSchema.optional(),
    isActive: z.boolean().optional(),
    phoneNumber: phoneSchema.optional(),
    roleCodes: z.array(roleCodeSchema).min(1).max(1).optional(),
    username: usernameSchema.optional(),
  })
  .strict();

/**
 * Body reset mật khẩu yêu cầu lý do đủ rõ để phục vụ audit.
 */
export const resetPasswordSchema = z.object({
  reason: z.string().trim().min(10).max(500),
});

/**
 * Query liệt kê nhân viên có phân trang và tìm kiếm nhẹ.
 */
export const listStaffSchema = z.object({
  departmentId: z.string().trim().min(1).max(36).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
});
