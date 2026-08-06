import { z } from 'zod';

import {
  departmentSchema,
  roleCodeSchema,
  type CreateStaffInput,
  type UpdateStaffInput,
} from './staff.schema';

/** Các field được phép hiển thị và map lỗi trong form tạo tài khoản. */
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

/** Các field được phép hiển thị và map lỗi trong form chỉnh sửa tài khoản. */
export const editStaffFormFields = [
  'fullName',
  'username',
  'phoneNumber',
  'identityCardNumber',
  'dateOfBirth',
  'gender',
  'departmentId',
  'roleCode',
  'isActive',
] as const;

/** Số di động Việt Nam 10 chữ số, không chứa khoảng trắng sau khi chuẩn hóa. */
const phoneNumberRegex = /^(03[2-9]|05[2689]|07[06-9]|08[1-9]|09[0-9])[0-9]{7}$/;
/** Username chỉ gồm chữ ASCII, số, dấu chấm hoặc gạch dưới; giới hạn độ dài nằm ở schema. */
const usernameRegex = /^[A-Za-z0-9._]+$/;
/** CCCD được kiểm tra ở dạng đúng 12 chữ số; không ghi giá trị thật vào comment hoặc log. */
const identityCardRegex = /^[0-9]{12}$/;
/** Ngày chỉ dùng định dạng `YYYY-MM-DD`, không bao gồm giờ hoặc timezone. */
const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
const createStaffFormFieldSet = new Set<string>(createStaffFormFields);
const editStaffFormFieldSet = new Set<string>(editStaffFormFields);

/** Loại bỏ khoảng trắng nhập thừa trước khi kiểm tra số điện thoại và CCCD. */
const normalizeWhitespace = (value: string) => value.replace(/\s+/g, '').trim();

/** Lấy ngày hiện tại theo timezone máy khách để tránh lệch ngày khi sinh giá trị cho input date. */
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

/** Kiểm tra ngày `YYYY-MM-DD` có tồn tại theo UTC, tránh Date tự cuốn ngày không hợp lệ. */
const isRealDateOnly = (value: string) => {
  if (!dateOnlyRegex.test(value)) return false;

  const parts = value.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (!year || !month || !day) return false;

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

/**
 * Validation phía UI cho form tạo staff.
 *
 * @remarks Schema kiểm tra định dạng, độ dài và điều kiện đủ 18 tuổi; backend vẫn là nguồn quyết
 * định cuối cùng về quyền, tính duy nhất và tính hợp lệ của dữ liệu nhạy cảm.
 */
export const createStaffFormSchema = z.object({
  dateOfBirth: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập ngày sinh')
    .regex(dateOnlyRegex, 'Ngày sinh phải theo định dạng YYYY-MM-DD')
    .refine(isRealDateOnly, 'Ngày sinh không hợp lệ')
    .refine((value) => value <= getTodayDateValue(), 'Ngày sinh không được ở tương lai')
    .refine((value) => value <= getMinimumAdultBirthDateValue(), 'Nhân viên phải đủ 18 tuổi'),
  departmentId: z.string().min(1, 'Vui lòng chọn khoa/phòng').pipe(departmentSchema),
  fullName: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(255),
  gender: z
    .string()
    .min(1, 'Vui lòng chọn giới tính')
    .pipe(z.enum(['male', 'female'])),
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

/** Validation phía UI cho form chỉnh sửa staff, bao gồm trạng thái active/locked. */
export const editStaffFormSchema = z.object({
  dateOfBirth: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập ngày sinh')
    .regex(dateOnlyRegex, 'Ngày sinh phải theo định dạng YYYY-MM-DD')
    .refine(isRealDateOnly, 'Ngày sinh không hợp lệ')
    .refine((value) => value <= getTodayDateValue(), 'Ngày sinh không được ở tương lai')
    .refine((value) => value <= getMinimumAdultBirthDateValue(), 'Nhân viên phải đủ 18 tuổi'),
  departmentId: z.string().min(1, 'Vui lòng chọn khoa/phòng').pipe(departmentSchema),
  fullName: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(255),
  gender: z
    .string()
    .min(1, 'Vui lòng chọn giới tính')
    .pipe(z.enum(['male', 'female'])),
  identityCardNumber: z
    .string()
    .transform(normalizeWhitespace)
    .pipe(z.string().regex(identityCardRegex, 'CCCD phải gồm đúng 12 chữ số')),
  isActive: z.boolean(),
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
export type EditStaffFormField = (typeof editStaffFormFields)[number];
export type EditStaffFormValues = z.input<typeof editStaffFormSchema>;
export type ParsedEditStaffFormValues = z.output<typeof editStaffFormSchema>;
export type EditStaffFormFieldErrors = Partial<Record<EditStaffFormField, string[]>>;

/**
 * Chuyển form đã parse thành payload create staff đúng hợp đồng backend.
 * Nhận dữ liệu đã qua schema nên không dùng fallback ngầm cho role hoặc khoa/phòng.
 *
 * @param values Giá trị output của `createStaffFormSchema`.
 * @returns Payload có `roleCodes` dạng mảng theo contract backend.
 */
export const toCreateStaffInput = (values: ParsedCreateStaffFormValues): CreateStaffInput => ({
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
 * Chuyển form chỉnh sửa thành payload PATCH theo đúng các field backend cho phép cập nhật.
 *
 * @remarks Giá trị được map nguyên trạng sau khi schema parse; `reason` cho thay đổi trạng thái
 * được nhập ở dialog khóa/mở khóa riêng và không tự suy diễn trong adapter này.
 * @param values Giá trị output của `editStaffFormSchema`.
 * @returns Payload PATCH chứa các field staff đã parse.
 */
export const toUpdateStaffInput = (values: ParsedEditStaffFormValues): UpdateStaffInput => ({
  dateOfBirth: values.dateOfBirth,
  departmentId: values.departmentId,
  fullName: values.fullName,
  gender: values.gender,
  identityCardNumber: values.identityCardNumber,
  isActive: values.isActive,
  phoneNumber: values.phoneNumber,
  roleCodes: [values.roleCode],
  username: values.username,
});

/**
 * Chuẩn hóa lỗi validation/API về đúng field của form create staff.
 * Nhận field map có thể đến từ Zod hoặc backend, trả subset mà UI đang hiển thị.
 *
 * @param fields Map field name sang danh sách message; key `roleCodes` được quy về `roleCode`.
 * @returns Partial field-error map, bỏ qua field không có trong form hoặc không có message.
 */
export const normalizeCreateStaffFieldErrors = (
  fields: Record<string, string[] | undefined>,
): CreateStaffFormFieldErrors =>
  Object.entries(fields).reduce<CreateStaffFormFieldErrors>((currentFields, [field, messages]) => {
    const normalizedField =
      field === 'roleCodes' || field.startsWith('roleCodes.') ? 'roleCode' : field;

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
 * Chuẩn hóa lỗi validation/API về đúng field đang cho phép chỉnh sửa trong form edit staff.
 *
 * @param fields Map field name sang danh sách message từ Zod hoặc backend.
 * @returns Partial field-error map chỉ gồm field có trong form edit.
 */
export const normalizeEditStaffFieldErrors = (
  fields: Record<string, string[] | undefined>,
): EditStaffFormFieldErrors =>
  Object.entries(fields).reduce<EditStaffFormFieldErrors>((currentFields, [field, messages]) => {
    const normalizedField =
      field === 'roleCodes' || field.startsWith('roleCodes.') ? 'roleCode' : field;

    if (!editStaffFormFieldSet.has(normalizedField) || !messages?.length) {
      return currentFields;
    }

    return {
      ...currentFields,
      [normalizedField]: [
        ...(currentFields[normalizedField as EditStaffFormField] ?? []),
        ...messages,
      ],
    };
  }, {});

/**
 * Chuyển Zod issues thành field errors để component không phụ thuộc trực tiếp chi tiết Zod.
 *
 * @param error Lỗi từ `createStaffFormSchema.safeParse`.
 * @returns Lỗi theo field để hiển thị cạnh input create.
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

/**
 * Chuyển Zod issues của form edit thành lỗi theo field để modal hiển thị cạnh input tương ứng.
 *
 * @param error Lỗi từ `editStaffFormSchema.safeParse`.
 * @returns Lỗi theo field để hiển thị cạnh input edit.
 */
export const getEditStaffValidationFieldErrors = (error: z.ZodError): EditStaffFormFieldErrors =>
  normalizeEditStaffFieldErrors(
    error.issues.reduce<Record<string, string[]>>((fields, issue) => {
      const field = issue.path.join('.');

      if (!field) return fields;

      return {
        ...fields,
        [field]: [...(fields[field] ?? []), issue.message],
      };
    }, {}),
  );
