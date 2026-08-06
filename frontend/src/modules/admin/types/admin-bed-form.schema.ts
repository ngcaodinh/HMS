import { z } from 'zod';

import type { BedFormValues, BedRecord, DepartmentCode } from './admin.types';

/** Danh sách field hợp lệ để ánh xạ lỗi Zod về đúng input của modal giường. */
export const bedFormFields = ['departmentCode', 'roomNumber', 'bedNumber', 'dailyRate', 'status'] as const;

const bedFormFieldSet = new Set<string>(bedFormFields);

const departmentCodeSchema = z.enum([
  'clinical',
  'dermatology',
  'laboratory',
  'pharmacy',
  'accounting',
  'reception',
  'it',
]);

const bedStatusSchema = z.enum(['available', 'occupied', 'maintenance']);

/** Chuyển chuỗi tiền nhập theo định dạng giao diện thành số nguyên VND để schema kiểm tra. */
const toPositiveNumber = (value: string) => Number(value.replace(/[.,\s]/g, ''));

/** Quy tắc form giường: khoa/phòng, định danh ngắn và đơn giá VND/ngày phải hợp lệ. */
export const bedFormSchema = z.object({
  bedNumber: z.string().trim().min(1, 'Vui lòng nhập số giường').max(10, 'Số giường tối đa 10 ký tự'),
  dailyRate: z
    .string()
    .min(1, 'Vui lòng nhập giá giường/ngày')
    .transform(toPositiveNumber)
    .pipe(z.number().positive('Giá giường/ngày phải lớn hơn 0')),
  departmentCode: z.string().min(1, 'Vui lòng chọn khoa/phòng').pipe(departmentCodeSchema),
  roomNumber: z.string().trim().min(1, 'Vui lòng nhập số phòng').max(10, 'Số phòng tối đa 10 ký tự'),
  status: bedStatusSchema,
});

export type BedFormField = (typeof bedFormFields)[number];

/** Kết quả sau parse; `dailyRate` đã được chuyển từ chuỗi sang số dương VND/ngày. */
export type ParsedBedFormValues = z.output<typeof bedFormSchema>;

/** Map lỗi theo field, mỗi field có thể có nhiều message từ Zod. */
export type BedFormFieldErrors = Partial<Record<BedFormField, string[]>>;

/**
 * Chuyển Zod issues thành lỗi theo field để modal thêm/sửa giường hiển thị cạnh input.
 * @param error - Lỗi từ `safeParse`, có thể chứa issue ở ngoài các field đang hiển thị.
 * @returns Map chỉ giữ issue có path trùng với field của form.
 */
export const getBedFormFieldErrors = (error: z.ZodError): BedFormFieldErrors =>
  error.issues.reduce<BedFormFieldErrors>((currentFields, issue) => {
    const field = issue.path.join('.');

    if (!bedFormFieldSet.has(field)) return currentFields;

    const typedField = field as BedFormField;

    return {
      ...currentFields,
      [typedField]: [...(currentFields[typedField] ?? []), issue.message],
    };
  }, {});

/**
 * Kiểm tra trùng số giường không phân biệt hoa thường trong cùng phòng.
 * @param bedList - Danh sách giường hiện có trên state cục bộ.
 * @param roomNumber - Số phòng cần kiểm tra.
 * @param bedNumber - Số giường cần kiểm tra.
 * @param excludeId - ID bản ghi đang sửa, không tính bản ghi này khi so sánh.
 * @returns `true` nếu cặp phòng/giường đã tồn tại.
 */
export const isBedNumberTaken = (
  bedList: Array<{ bedNumber: string; id: string; roomNumber: string }>,
  roomNumber: string,
  bedNumber: string,
  excludeId?: string,
): boolean =>
  bedList.some(
    (bed) =>
      bed.id !== excludeId &&
      bed.roomNumber.toLowerCase() === roomNumber.toLowerCase() &&
      bed.bedNumber.toLowerCase() === bedNumber.toLowerCase(),
  );

/** Giá trị mặc định khi mở form mới; trạng thái ban đầu là `available`. */
export const emptyBedFormValues: BedFormValues = {
  bedNumber: '',
  dailyRate: '',
  departmentCode: '',
  roomNumber: '',
  status: 'available',
};

/** Đưa bản ghi giường về dữ liệu thô của form, giữ đơn giá ở dạng chuỗi để người dùng chỉnh sửa. */
export const toBedFormValues = (bed: BedRecord): BedFormValues => ({
  bedNumber: bed.bedNumber,
  dailyRate: String(bed.dailyRate),
  departmentCode: bed.departmentCode as '' | DepartmentCode,
  roomNumber: bed.roomNumber,
  status: bed.status,
});
