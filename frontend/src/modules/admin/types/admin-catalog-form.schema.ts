import { z } from 'zod';

import type { DepartmentCode, ServiceCatalogFormValues, ServiceCatalogItem } from './admin.types';

/** Danh sách field hợp lệ để ánh xạ lỗi Zod về đúng input của modal danh mục. */
export const catalogFormFields = [
  'code',
  'name',
  'departmentCode',
  'price',
  'coveredByHealthInsurance',
  'healthInsuranceCeilingPrice',
] as const;

const catalogFormFieldSet = new Set<string>(catalogFormFields);

/** Mã dịch vụ sau chuẩn hóa phải là chữ hoa, chữ số hoặc gạch ngang, dài 3–30 ký tự. */
const serviceCodeRegex = /^[A-Z0-9-]{3,30}$/;

const departmentCodeSchema = z.enum([
  'clinical',
  'dermatology',
  'laboratory',
  'pharmacy',
  'accounting',
  'reception',
  'it',
]);

/** Chuyển chuỗi tiền nhập theo giao diện thành số nguyên VND trước khi kiểm tra dương. */
const toPositiveNumber = (value: string) => Number(value.replace(/[.,\s]/g, ''));

/** Quy tắc danh mục: mã/tên hợp lệ và mức trần BHYT không vượt giá dịch vụ. */
export const catalogFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(serviceCodeRegex, 'Mã dịch vụ chỉ gồm chữ hoa, số và dấu gạch ngang (3-30 ký tự)'),
    coveredByHealthInsurance: z.boolean(),
    departmentCode: z.string().min(1, 'Vui lòng chọn khoa/phòng').pipe(departmentCodeSchema),
    healthInsuranceCeilingPrice: z.string(),
    name: z.string().trim().min(3, 'Tên dịch vụ phải có ít nhất 3 ký tự').max(255),
    price: z
      .string()
      .min(1, 'Vui lòng nhập giá dịch vụ')
      .transform(toPositiveNumber)
      .pipe(z.number().positive('Giá dịch vụ phải lớn hơn 0')),
  })
  .transform((values) => ({
    ...values,
    healthInsuranceCeilingPrice: values.healthInsuranceCeilingPrice.trim()
      ? toPositiveNumber(values.healthInsuranceCeilingPrice)
      : null,
  }))
  .refine(
    (values) => !values.coveredByHealthInsurance || values.healthInsuranceCeilingPrice !== null,
    {
      message: 'Vui lòng nhập mức trần BHYT khi dịch vụ được bảo hiểm chi trả',
      path: ['healthInsuranceCeilingPrice'],
    },
  )
  .refine(
    (values) =>
      !values.coveredByHealthInsurance ||
      values.healthInsuranceCeilingPrice === null ||
      values.healthInsuranceCeilingPrice > 0,
    {
      message: 'Mức trần BHYT phải lớn hơn 0',
      path: ['healthInsuranceCeilingPrice'],
    },
  )
  .refine(
    (values) =>
      !values.coveredByHealthInsurance ||
      values.healthInsuranceCeilingPrice === null ||
      values.healthInsuranceCeilingPrice <= values.price,
    {
      message: 'Mức trần BHYT không được vượt quá giá dịch vụ',
      path: ['healthInsuranceCeilingPrice'],
    },
  );

export type CatalogFormField = (typeof catalogFormFields)[number];

/** Kết quả sau parse; giá và mức trần đã thành số VND, mức trần bỏ trống thành `null`. */
export type ParsedCatalogFormValues = z.output<typeof catalogFormSchema>;

/** Map lỗi theo field, mỗi field có thể có nhiều message từ Zod. */
export type CatalogFormFieldErrors = Partial<Record<CatalogFormField, string[]>>;

/**
 * Chuyển Zod issues thành lỗi theo field để modal danh mục hiển thị cạnh input.
 * @param error - Lỗi từ `safeParse`, có thể chứa issue ở ngoài các field đang hiển thị.
 * @returns Map chỉ giữ issue có path trùng với field của form.
 */
export const getCatalogFormFieldErrors = (error: z.ZodError): CatalogFormFieldErrors =>
  error.issues.reduce<CatalogFormFieldErrors>((currentFields, issue) => {
    const field = issue.path.join('.');

    if (!catalogFormFieldSet.has(field)) return currentFields;

    const typedField = field as CatalogFormField;

    return {
      ...currentFields,
      [typedField]: [...(currentFields[typedField] ?? []), issue.message],
    };
  }, {});

/**
 * Kiểm tra mã dịch vụ trùng không phân biệt hoa thường trong danh mục cục bộ.
 * @param catalogList - Danh sách danh mục hiện có trên state cục bộ.
 * @param code - Mã cần kiểm tra sau hoặc trước khi chuẩn hóa.
 * @param excludeId - ID bản ghi đang sửa, không tính bản ghi này khi so sánh.
 * @returns `true` nếu mã đã tồn tại.
 */
export const isCatalogCodeTaken = (
  catalogList: Array<{ id: string; code: string }>,
  code: string,
  excludeId?: string,
): boolean =>
  catalogList.some(
    (item) => item.id !== excludeId && item.code.toLowerCase() === code.toLowerCase(),
  );

/** Giá trị mặc định khi mở form mới; BHYT tắt và mức trần để trống. */
export const emptyCatalogFormValues: ServiceCatalogFormValues = {
  code: '',
  coveredByHealthInsurance: false,
  departmentCode: '',
  healthInsuranceCeilingPrice: '',
  name: '',
  price: '',
};

/** Đưa bản ghi danh mục về dữ liệu thô của form, đổi số tiền VND sang chuỗi nhập liệu. */
export const toCatalogFormValues = (item: {
  code: string;
  coveredByHealthInsurance: boolean;
  departmentCode: DepartmentCode;
  healthInsuranceCeilingPrice: number | null;
  name: string;
  price: number;
}): ServiceCatalogFormValues => ({
  code: item.code,
  coveredByHealthInsurance: item.coveredByHealthInsurance,
  departmentCode: item.departmentCode,
  healthInsuranceCeilingPrice:
    item.healthInsuranceCeilingPrice === null ? '' : String(item.healthInsuranceCeilingPrice),
  name: item.name,
  price: String(item.price),
});

/** Type-only re-export để component không cần import trực tiếp từ admin.types khi chỉ cần shape form. */
export type { ServiceCatalogItem };
