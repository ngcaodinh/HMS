/**
 * Static ICD-10 fixture standing in for `IcdCatalogPort` — the versioned ICD dataset has no
 * table in the SQL schema (task breakdown §Lane 3 `getIcd10Catalog`). Ported from the sample
 * code list used in `Tailieu/doctor.html`.
 */
export const ICD10_CODING_SYSTEM = 'TT06_2026';
export const ICD10_EFFECTIVE_FROM = '2026-07-01';

export interface Icd10Entry {
  code: string;
  name: string;
}

export const ICD10_CATALOG: Icd10Entry[] = [
  { code: 'L50.0', name: 'Mề đay dị ứng' },
  { code: 'L30.9', name: 'Viêm da, không đặc hiệu' },
  { code: 'L23.9', name: 'Viêm da tiếp xúc dị ứng' },
  { code: 'L20.9', name: 'Viêm da cơ địa, không đặc hiệu' },
  { code: 'L70.0', name: 'Trứng cá thông thường' },
  { code: 'L40.9', name: 'Vảy nến, không đặc hiệu' },
  { code: 'B35.9', name: 'Nấm da, không đặc hiệu' },
  { code: 'J45.0', name: 'Hen chủ yếu dị ứng' },
  { code: 'T78.4', name: 'Dị ứng, không xác định' },
];

export function findIcd10ByCode(code: string): Icd10Entry | undefined {
  return ICD10_CATALOG.find((entry) => entry.code === code);
}

export function searchIcd10(keyword?: string): Icd10Entry[] {
  if (!keyword) return ICD10_CATALOG;
  const normalized = keyword.trim().toLowerCase();
  return ICD10_CATALOG.filter(
    (entry) =>
      entry.code.toLowerCase().includes(normalized) || entry.name.toLowerCase().includes(normalized),
  );
}
