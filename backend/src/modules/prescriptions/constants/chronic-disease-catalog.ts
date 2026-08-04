/**
 * Danh mục mã ICD-10 được phép dùng để giải trình đơn thuốc dài ngày.
 * Danh mục này là allowlist phía server; không dùng tên bệnh do client gửi để quyết định.
 */
export const CHRONIC_DISEASE_ICD10_CODES = new Set([
  'E11.9', // Đái tháo đường type 2
  'E78.5', // Rối loạn chuyển hóa lipoprotein
  'G40.9', // Động kinh, không đặc hiệu
  'I10', // Tăng huyết áp nguyên phát
  'I25.1', // Bệnh tim thiếu máu cục bộ mạn
  'I50.9', // Suy tim, không đặc hiệu
  'J44.9', // Bệnh phổi tắc nghẽn mạn tính
  'J45.0', // Hen phế quản chủ yếu dị ứng
  'J45.9', // Hen phế quản, không đặc hiệu
  'L20.9', // Viêm da cơ địa, không đặc hiệu
  'L40.9', // Vảy nến, không đặc hiệu
]);

/** Kiểm tra mã ICD-10 có thuộc allowlist bệnh mạn tính được kê dài ngày hay không. */
export function isChronicDiseaseCode(icd10: string | null | undefined): boolean {
  return Boolean(icd10 && CHRONIC_DISEASE_ICD10_CODES.has(icd10));
}
