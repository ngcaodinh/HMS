import { z } from 'zod';

import {
  departmentSchema,
  roleCodeSchema,
  type CreateStaffInput,
} from './staff.schema';

export const createStaffFormFields = [
  'fullName',
  'username',
  'phoneNumber',
  'identityCardNumber',
  'dateOfBirth',
  'gender',
  'departmentId',
  'roleCode',
] as const;

const phoneNumberRegex = /^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-9])[0-9]{7}$/;
const usernameRegex = /^[A-Za-z0-9._]+$/;
const identityCardRegex = /^[0-9]{12}$/;
const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
const createStaffFormFieldSet = new Set<string>(createStaffFormFields);

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, '').trim();

const getTodayDateValue = () => {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localTime.toISOString().slice(0, 10);
};

const isRealDateOnly = (value: string) => {
  if (!dateOnlyRegex.test(value)) return false;

  const parts = value.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (!year || !month || !day) return false;

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const createStaffFormSchema = z.object({
  dateOfBirth: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập ngày sinh')
    .regex(dateOnlyRegex, 'Ngày sinh phải theo định dạng YYYY-MM-DD')
    .refine(isRealDateOnly, 'Ngày sinh không hợp lệ')
    .refine((value) => value <= getTodayDateValue(), 'Ngày sinh không được ở tương lai'),
  departmentId: z.string().min(1, 'Vui lòng chọn khoa/phòng').pipe(departmentSchema),
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

export type CreateStaffFormField = (typeof createStaffFormFields)[number];
export type CreateStaffFormValues = z.input<typeof createStaffFormSchema>;
export type ParsedCreateStaffFormValues = z.output<typeof createStaffFormSchema>;
export type CreateStaffFormFieldErrors = Partial<Record<CreateStaffFormField, string[]>>;

/**
 * Chuyển form đã parse thành payload create staff đúng hợp đồng backend.
 * Nhận dữ liệu đã qua schema nên không dùng fallback ngầm cho role hoặc khoa/phòng.
 */
export const toCreateStaffInput = (
  values: ParsedCreateStaffFormValues,
): CreateStaffInput => ({
  dateOfBirth: values.dateOfBirth,
  departmentId: values.departmentId,
  fullName: values.fullName,
  gender: values.gender,
  identityCardNumber: values.identityCardNumber,
  phoneNumber: values.phoneNumber,
  roleCodes: [values.roleCode],
  username: values.username,
});

/**
 * Chuẩn hóa lỗi validation/API về đúng field của form create staff.
 * Nhận field map có thể đến từ Zod hoặc backend, trả subset mà UI đang hiển thị.
 */
export const normalizeCreateStaffFieldErrors = (
  fields: Record<string, string[] | undefined>,
): CreateStaffFormFieldErrors =>
  Object.entries(fields).reduce<CreateStaffFormFieldErrors>((currentFields, [field, messages]) => {
    const normalizedField = field === 'roleCodes' || field.startsWith('roleCodes.')
      ? 'roleCode'
      : field;

    if (!createStaffFormFieldSet.has(normalizedField) || !messages?.length) {
      return currentFields;
    }

    return {
      ...currentFields,
      [normalizedField]: [
        ...(currentFields[normalizedField as CreateStaffFormField] ?? []),
        ...messages,
      ],
    };
  }, {});

/**
 * Chuyển Zod issues thành field errors để component không phụ thuộc trực tiếp chi tiết Zod.
 */
export const getCreateStaffValidationFieldErrors = (
  error: z.ZodError,
): CreateStaffFormFieldErrors =>
  normalizeCreateStaffFieldErrors(
    error.issues.reduce<Record<string, string[]>>((fields, issue) => {
      const field = issue.path.join('.');

      if (!field) return fields;

      return {
        ...fields,
        [field]: [...(fields[field] ?? []), issue.message],
      };
    }, {}),
  );
