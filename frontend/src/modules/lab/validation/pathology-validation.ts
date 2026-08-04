import type { PathologyResult } from '../types/lab-test.types';

const ICD10_MORPHOLOGY_REGEX = /^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/;
const USER_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PATHOLOGY_USER_FIELDS = ['bacSiGiaiPhauBenh', 'nguoiPhaBenhPham', 'nguoiLamTieuBan'] as const;

/** Kiểm tra mã ICD-10, UUID nhân sự và điều kiện bắt buộc khi hoàn tất GPB. */
export function getPathologyFieldErrors(value: PathologyResult): Record<string, string> {
  const errors: Record<string, string> = {};
  const icd10 = value.icd10MoHoc?.trim();

  if (icd10 && !ICD10_MORPHOLOGY_REGEX.test(icd10)) {
    errors.icd10MoHoc = 'Mã ICD-10 không đúng định dạng, VD: L23.9.';
  }

  for (const field of PATHOLOGY_USER_FIELDS) {
    const userId = value[field]?.trim();
    if (userId && !USER_ID_REGEX.test(userId)) {
      errors[field] = 'Mã người dùng không đúng định dạng UUID.';
    }
  }

  if (
    value.soManh !== undefined &&
    value.soManh !== null &&
    (!Number.isInteger(value.soManh) || value.soManh <= 0)
  ) {
    errors.soManh = 'Số mảnh phải là số nguyên dương.';
  }

  if (value.ngayTraKetQua && Number.isNaN(new Date(value.ngayTraKetQua).getTime())) {
    errors.ngayTraKetQua = 'Ngày trả kết quả không hợp lệ.';
  }

  if (value.trangThai === 'da_co_ket_qua') {
    if (!value.chanDoanMoHoc?.trim())
      errors.chanDoanMoHoc = 'Chẩn đoán giải phẫu bệnh là bắt buộc.';
    if (!value.bacSiGiaiPhauBenh?.trim()) errors.bacSiGiaiPhauBenh = 'Cần nhập bác sĩ đọc kết quả.';
    if (!value.ngayTraKetQua) errors.ngayTraKetQua = 'Ngày trả kết quả là bắt buộc.';
  }

  return errors;
}
