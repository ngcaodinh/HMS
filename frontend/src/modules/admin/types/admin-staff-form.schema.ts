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

/** Số di động Việt Nam gồm 10 chữ số sau khi bỏ khoảng trắng. */
const phoneNumberRegex = /^(03[2-9]|05[2689]|07[06-9]|08[1-9]|09[0-9])[0-9]{7}$/;
/** Username chỉ nhận chữ ASCII, số, dấu chấm và gạch dưới. */
const usernameRegex = /^[A-Za-z0-9._]+$/;
/** CCCD phải là đúng 12 chữ số; không lưu khoảng trắng trong giá trị đã chuẩn hóa. */
const identityCardRegex = /^[0-9]{12}$/;
/** Ngày form dùng định dạng ngày lịch không kèm múi giờ `YYYY-MM-DD`. */
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

/** Loại khoảng trắng khỏi các trường định danh trước khi kiểm tra định dạng. */
const normalizeWhitespace = (value: string) => value.replace(/\s+/g, '').trim();

/** Lấy ngày hiện tại theo múi giờ máy khách, tránh lệch ngày khi đổi từ UTC sang chuỗi form. */
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

/** Kiểm tra ngày `YYYY-MM-DD` có tồn tại trên lịch, không chỉ đúng theo regex. */
const isRealDateOnly = (value: string) => {
  if (!dateOnlyRegex.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return false;

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

/** Quy tắc form nhân sự: định dạng định danh, ngày hợp lệ và tuổi tối thiểu 18. */
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

/** Kết quả sau parse của form nhân sự, đã loại khoảng trắng ở CCCD và số điện thoại. */
export type ParsedStaffFormValues = z.output<typeof staffFormSchema>;

/** Map lỗi theo field, mỗi field có thể có nhiều message từ Zod. */
export type StaffFormFieldErrors = Partial<Record<StaffFormField, string[]>>;

/**
 * Chuyển Zod issues thành field errors để modal hiển thị lỗi ngay cạnh input tương ứng.
 * @param error - Lỗi từ `safeParse`, có thể chứa issue ngoài field đang hiển thị.
 * @returns Map field -> danh sách message chỉ gồm các field form đang hiển thị.
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
 * Kiểm tra username trùng không phân biệt hoa thường trong danh sách nhân sự cục bộ.
 * @param staffList - Danh sách nhân sự hiện có trên state cục bộ.
 * @param username - Username cần kiểm tra.
 * @param excludeId - ID bản ghi đang sửa, không tính bản ghi này khi so sánh.
 * @returns `true` nếu username đã tồn tại.
 */
export const isStaffUsernameTaken = (
  staffList: Array<{ id: string; username: string }>,
  username: string,
  excludeId?: string,
): boolean =>
  staffList.some(
    (staff) => staff.id !== excludeId && staff.username.toLowerCase() === username.toLowerCase(),
  );

/** Giá trị mặc định khi mở form mới; các lựa chọn bắt buộc bắt đầu ở trạng thái rỗng. */
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

/** Đưa bản ghi nhân sự về dữ liệu thô của form để chỉnh sửa trên state cục bộ. */
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
