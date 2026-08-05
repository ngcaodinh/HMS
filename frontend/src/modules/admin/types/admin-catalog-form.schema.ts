import { z } from 'zod';

import type { DepartmentCode, ServiceCatalogFormValues, ServiceCatalogItem } from './admin.types';

export const catalogFormFields = [
  'code',
  'name',
  'departmentCode',
  'price',
  'coveredByHealthInsurance',
  'healthInsuranceCeilingPrice',
] as const;

const catalogFormFieldSet = new Set<string>(catalogFormFields);

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

const toPositiveNumber = (value: string) => Number(value.replace(/[.,\s]/g, ''));

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
export type ParsedCatalogFormValues = z.output<typeof catalogFormSchema>;
export type CatalogFormFieldErrors = Partial<Record<CatalogFormField, string[]>>;

/**
 * Chuyển Zod issues thành field errors để modal danh mục dịch vụ hiển thị lỗi cạnh input.
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
 * Kiểm tra mã dịch vụ đã tồn tại trong danh mục hiện có (loại trừ chính bản ghi đang sửa).
 */
export const isCatalogCodeTaken = (
  catalogList: Array<{ id: string; code: string }>,
  code: string,
  excludeId?: string,
): boolean =>
  catalogList.some(
    (item) => item.id !== excludeId && item.code.toLowerCase() === code.toLowerCase(),
  );

export const emptyCatalogFormValues: ServiceCatalogFormValues = {
  code: '',
  coveredByHealthInsurance: false,
  departmentCode: '',
  healthInsuranceCeilingPrice: '',
  name: '',
  price: '',
};

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
