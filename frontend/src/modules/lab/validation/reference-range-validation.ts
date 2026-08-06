import type { ResultTableKey } from '../types/lab-test.types';

/** Danh sách field hợp lệ theo resultTableKey; UI không cho nhập fieldKey tự do. */
export const REFERENCE_RANGE_FIELDS: Record<ResultTableKey, string[]> = {
  xn_cong_thuc_mau: [
    'wbc',
    'neu',
    'lym',
    'mono',
    'eos',
    'baso',
    'rbc',
    'hgb',
    'hct',
    'mcv',
    'mch',
    'mchc',
    'rdw',
    'plt',
    'mpv',
    'pdw',
    'pct',
  ],
  xn_hoa_sinh_mau: [
    'ure',
    'glucose',
    'creatinin',
    'acidUric',
    'bilirubinTP',
    'bilirubinTT',
    'bilirubinGT',
    'proteinTP',
    'albumin',
    'globulin',
    'tyLeAG',
    'fibrinogen',
    'cholesterol',
    'triglycerid',
    'hdlCho',
    'ldlCho',
    'natri',
    'kali',
    'clorua',
    'calci',
    'calciIon',
    'phospho',
    'sat',
    'magie',
    'ast',
    'alt',
    'amylase',
    'ck',
    'ckMb',
    'ldh',
    'ggt',
    'cholinesterase',
    'phosphataseKiem',
    'phDongMach',
    'pco2',
    'po2DongMach',
    'hco3Chuan',
    'kiemDu',
  ],
  xn_nuoc_tieu: [
    'ph',
    'tyTrong',
    'nt24TheTich',
    'nt24Protein',
    'nt24Glucose',
    'nt24Ure',
    'nt24Creatinin',
    'nt24AcidUric',
    'nt24Amylase',
    'nt24Na',
    'nt24K',
    'dntProtein',
    'dntGlucose',
    'dntClorua',
    'dichViHClTuDo',
    'dichViHClToanPhan',
    'dcdProtein',
  ],
  xn_vi_sinh: [],
  xn_mo_benh_hoc: [],
};

/** Giá trị form khoảng tham chiếu; bound là chuỗi số để giữ input trước khi validate. */
export interface ReferenceRangeFormValue {
  code: string;
  fieldKey: string;
  label: string;
  labTestTypeId: string;
  lowerBound: string;
  upperBound: string;
}

/** Kiểm tra dữ liệu khoảng tham chiếu trước khi gửi API để lỗi xuất hiện ngay tại field. */
export function getReferenceRangeFormErrors(
  value: ReferenceRangeFormValue,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!value.labTestTypeId) errors.labTestTypeId = 'Cần chọn loại xét nghiệm.';
  if (!value.fieldKey) errors.fieldKey = 'Cần chọn chỉ số.';
  if (!value.code.trim()) errors.code = 'Cần nhập mã chỉ số.';
  else if (!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(value.code.trim()))
    errors.code = 'Mã chỉ được chứa chữ, số và dấu gạch ngang.';
  if (!value.label.trim()) errors.label = 'Cần nhập tên chỉ số.';

  const lower = value.lowerBound.trim() ? Number(value.lowerBound) : undefined;
  const upper = value.upperBound.trim() ? Number(value.upperBound) : undefined;
  if (lower !== undefined && !Number.isFinite(lower))
    errors.lowerBound = 'Ngưỡng dưới phải là số hợp lệ.';
  if (upper !== undefined && !Number.isFinite(upper))
    errors.upperBound = 'Ngưỡng trên phải là số hợp lệ.';
  if (
    lower !== undefined &&
    upper !== undefined &&
    Number.isFinite(lower) &&
    Number.isFinite(upper) &&
    lower >= upper
  ) {
    errors.upperBound = 'Ngưỡng trên phải lớn hơn ngưỡng dưới.';
  }
  return errors;
}
