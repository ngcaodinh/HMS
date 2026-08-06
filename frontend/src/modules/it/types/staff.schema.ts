import { z } from 'zod';

/** Mã role đầy đủ mà API có thể trả về hoặc nhận trong payload quản lý tài khoản. */
export const roleCodeSchema = z.enum([
  'admin',
  'receptionist',
  'accountant',
  'doctor',
  'nurse',
  'lab_tech',
  'pharmacist',
  'it_tech',
  'director',
]);

/** Nhóm role nhân viên đích được dùng trong các contract quản lý staff. */
export const managedRoleCodeSchema = z.enum([
  'receptionist',
  'accountant',
  'doctor',
  'nurse',
  'lab_tech',
  'pharmacist',
]);

/** Mã khoa/phòng dạng code; nhãn hiển thị được ánh xạ riêng ở workspace IT. */
export const departmentSchema = z.enum([
  'clinical',
  'dermatology',
  'laboratory',
  'pharmacy',
  'accounting',
  'reception',
  'it',
]);

/**
 * Contract tài khoản staff sau khi parse từ API.
 *
 * @remarks `createdAt`, `updatedAt` và `lastLoginAt` là chuỗi thời gian từ backend; `lastLoginAt`
 * có thể `null`. `isActive` là trạng thái khóa/mở khóa, còn `mustChangePassword` cho biết tài
 * khoản phải đổi mật khẩu ở lần đăng nhập sau. Contract này không chứa password hoặc password
 * hash.
 */
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
  roleCodes: z.array(roleCodeSchema).min(1),
  updatedAt: z.string(),
  username: z.string(),
});

/** Contract phân trang danh sách staff, trong đó `page` bắt đầu từ 1 theo query hiện tại. */
export const staffListSchema = z.object({
  items: z.array(staffUserSchema),
  page: z.number(),
  pageSize: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

/**
 * Envelope backend trả về khi tạo hoặc reset tài khoản.
 *
 * @remarks `temporaryPassword` là credential chỉ được hiển thị một lần; UI không được coi đây là
 * dữ liệu có thể cache hoặc lưu lâu dài.
 */
export const createStaffResultSchema = z.object({
  temporaryPassword: z.string(),
  user: staffUserSchema,
});

/**
 * Payload POST tạo staff; `dateOfBirth` dùng `YYYY-MM-DD`, `roleCodes` thường chứa một role từ
 * form.
 */
export type CreateStaffInput = {
  dateOfBirth: string;
  departmentId: DepartmentCode;
  fullName: string;
  gender: 'male' | 'female';
  identityCardNumber: string;
  phoneNumber: string;
  roleCodes: RoleCode[];
  username: string;
};

/**
 * Payload PATCH cho các field backend cho phép cập nhật; `reason` dùng để ghi audit khi đổi trạng
 * thái.
 */
export type UpdateStaffInput = {
  dateOfBirth?: string;
  departmentId?: DepartmentCode;
  fullName?: string;
  gender?: 'male' | 'female';
  identityCardNumber?: string;
  isActive?: boolean;
  phoneNumber?: string;
  reason?: string;
  roleCodes?: RoleCode[];
  username?: string;
};

/** Bộ lọc danh sách staff; `isActive` không truyền nghĩa là lấy cả tài khoản khóa và mở. */
export type StaffListFilter = {
  departmentId?: DepartmentCode;
  isActive?: boolean;
  roleCode?: RoleCode;
};

export type StaffUser = z.infer<typeof staffUserSchema>;
export type StaffList = z.infer<typeof staffListSchema>;
export type CreateStaffResult = z.infer<typeof createStaffResultSchema>;
export type DepartmentCode = z.infer<typeof departmentSchema>;
export type RoleCode = z.infer<typeof roleCodeSchema>;
export type ManagedRoleCode = z.infer<typeof managedRoleCodeSchema>;
