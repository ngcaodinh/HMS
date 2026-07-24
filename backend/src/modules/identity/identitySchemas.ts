import { z } from 'zod';

import { roleCodes } from './identityTypes';

/**
 * Các regex đầu vào cố định giúp route trả lỗi validation trước khi vào service.
 */
const phoneSchema = z.string().regex(/^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-9])[0-9]{7}$/);
const identityCardSchema = z.string().regex(/^[0-9]{12}$/);
const usernameSchema = z.string().trim().min(3).max(50).regex(/^[A-Za-z0-9._]+$/);
const roleCodeSchema = z.enum(roleCodes);

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
export const createStaffSchema = z.object({
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departmentId: z.string().min(1).max(36),
  fullName: z.string().trim().min(2).max(255),
  gender: z.enum(['male', 'female']),
  identityCardNumber: identityCardSchema,
  phoneNumber: phoneSchema,
  roleCodes: z.array(roleCodeSchema).min(1).max(1),
  supportRequestReference: z.string().trim().min(3).max(100).optional(),
  username: usernameSchema,
});

/**
 * Body cập nhật tài khoản; strict để chặn field ngoài hợp đồng API.
 */
export const updateStaffSchema = z
  .object({
    departmentId: z.string().min(1).max(36).optional(),
    fullName: z.string().trim().min(2).max(255).optional(),
    isActive: z.boolean().optional(),
    phoneNumber: phoneSchema.optional(),
    roleCodes: z.array(roleCodeSchema).min(1).max(1).optional(),
    supportRequestReference: z.string().trim().min(3).max(100).optional(),
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
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
});
