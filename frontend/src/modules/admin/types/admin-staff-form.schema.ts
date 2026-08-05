import { z } from 'zod';

import type { DepartmentCode, RoleCode, StaffFormValues } from './admin.types';

export const staffFormFields = [
  'fullName',
  'username',
  'phoneNumber',
  'identityCardNumber',
  'dateOfBirth',
  'gender',
  'departmentCode',
  'roleCode',
] as const;

const staffFormFieldSet = new Set<string>(staffFormFields);

const phoneNumberRegex = /^(03[2-9]|05[2689]|07[06-9]|08[1-9]|09[0-9])[0-9]{7}$/;
const usernameRegex = /^[A-Za-z0-9._]+$/;
const identityCardRegex = /^[0-9]{12}$/;
const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

const departmentCodeSchema = z.enum([
  'clinical',
  'dermatology',
  'laboratory',
  'pharmacy',
  'accounting',
  'reception',
  'it',
]);

const roleCodeSchema = z.enum([
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

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, '').trim();

const getTodayDateValue = () => {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localTime.toISOString().slice(0, 10);
};

/** Tính ngày sinh tối thiểu để form không nhận nhân viên chưa đủ 18 tuổi. */
const getMinimumAdultBirthDateValue = () => {
  const today = getTodayDateValue();
  const [year, month, day] = today.split('-').map(Number);

  return `${String(year - 18).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const isRealDateOnly = (value: string) => {
  if (!dateOnlyRegex.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return false;

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

export const staffFormSchema = z.object({
  dateOfBirth: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập ngày sinh')
    .regex(dateOnlyRegex, 'Ngày sinh phải theo định dạng YYYY-MM-DD')
    .refine(isRealDateOnly, 'Ngày sinh không hợp lệ')
    .refine((value) => value <= getTodayDateValue(), 'Ngày sinh không được ở tương lai')
    .refine((value) => value <= getMinimumAdultBirthDateValue(), 'Nhân viên phải đủ 18 tuổi'),
  departmentCode: z.string().min(1, 'Vui lòng chọn khoa/phòng').pipe(departmentCodeSchema),
  fullName: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(255),
  gender: z.string().min(1, 'Vui lòng chọn giới tính').pipe(z.enum(['male', 'female'])),
  identityCardNumber: z
    .string()
    .transform(normalizeWhitespace)
    .pipe(z.string().regex(identityCardRegex, 'CCCD phải gồm đúng 12 chữ số')),
  phoneNumber: z
    .string()
    .transform(normalizeWhitespace)
    .pipe(z.string().regex(phoneNumberRegex, 'Số điện thoại di động Việt Nam không hợp lệ')),
  roleCode: z.string().min(1, 'Vui lòng chọn vai trò').pipe(roleCodeSchema),
  username: z
    .string()
    .trim()
    .min(3, 'Username phải có ít nhất 3 ký tự')
    .max(50, 'Username không được vượt quá 50 ký tự')
    .regex(usernameRegex, 'Username chỉ gồm chữ, số, dấu chấm hoặc gạch dưới'),
});

export type StaffFormField = (typeof staffFormFields)[number];
export type ParsedStaffFormValues = z.output<typeof staffFormSchema>;
export type StaffFormFieldErrors = Partial<Record<StaffFormField, string[]>>;

/**
 * Chuyển Zod issues thành field errors để modal hiển thị lỗi ngay cạnh input tương ứng.
 * Nhận ZodError từ safeParse, trả map field -> danh sách message chỉ gồm các field form đang hiển thị.
 */
export const getStaffFormFieldErrors = (error: z.ZodError): StaffFormFieldErrors =>
  error.issues.reduce<StaffFormFieldErrors>((currentFields, issue) => {
    const field = issue.path.join('.');

    if (!staffFormFieldSet.has(field)) return currentFields;

    const typedField = field as StaffFormField;

    return {
      ...currentFields,
      [typedField]: [...(currentFields[typedField] ?? []), issue.message],
    };
  }, {});

/**
 * Kiểm tra username đã tồn tại trong danh sách nhân viên hiện có (loại trừ chính bản ghi đang sửa).
 * Dùng để chặn trùng username ngay trên state cục bộ vì module này không gọi API thật.
 */
export const isStaffUsernameTaken = (
  staffList: Array<{ id: string; username: string }>,
  username: string,
  excludeId?: string,
): boolean =>
  staffList.some(
    (staff) => staff.id !== excludeId && staff.username.toLowerCase() === username.toLowerCase(),
  );

export const emptyStaffFormValues: StaffFormValues = {
  dateOfBirth: '',
  departmentCode: '',
  fullName: '',
  gender: '',
  identityCardNumber: '',
  phoneNumber: '',
  roleCode: '',
  username: '',
};

export const toStaffFormValues = (staff: {
  dateOfBirth: string;
  departmentCode: DepartmentCode;
  fullName: string;
  gender: 'male' | 'female';
  identityCardNumber: string;
  phoneNumber: string;
  roleCode: RoleCode;
  username: string;
}): StaffFormValues => ({
  dateOfBirth: staff.dateOfBirth,
  departmentCode: staff.departmentCode,
  fullName: staff.fullName,
  gender: staff.gender,
  identityCardNumber: staff.identityCardNumber,
  phoneNumber: staff.phoneNumber,
  roleCode: staff.roleCode,
  username: staff.username,
});
