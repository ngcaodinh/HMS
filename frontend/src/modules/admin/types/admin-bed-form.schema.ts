import { z } from 'zod';

import type { BedFormValues, BedRecord, DepartmentCode } from './admin.types';

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

const toPositiveNumber = (value: string) => Number(value.replace(/[.,\s]/g, ''));

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
export type ParsedBedFormValues = z.output<typeof bedFormSchema>;
export type BedFormFieldErrors = Partial<Record<BedFormField, string[]>>;

/** Chuyển Zod issues thành field errors để modal thêm/sửa giường hiển thị lỗi cạnh input. */
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

/** Kiểm tra một phòng đã có giường trùng số (loại trừ chính bản ghi đang sửa) để tránh trùng lặp. */
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

export const emptyBedFormValues: BedFormValues = {
  bedNumber: '',
  dailyRate: '',
  departmentCode: '',
  roomNumber: '',
  status: 'available',
};

export const toBedFormValues = (bed: BedRecord): BedFormValues => ({
  bedNumber: bed.bedNumber,
  dailyRate: String(bed.dailyRate),
  departmentCode: bed.departmentCode as '' | DepartmentCode,
  roomNumber: bed.roomNumber,
  status: bed.status,
});
