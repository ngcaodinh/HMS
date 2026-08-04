import { ApiError } from '@/shared/api-client/error';

export const VN_MOBILE_PHONE_REGEX = /^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-9])[0-9]{7}$/;

export const VITAL_LIMITS = {
  pulse: { min: 30, max: 220, label: 'mạch' },
  temperatureC: { min: 34, max: 43, label: 'nhiệt độ' },
  bpSystolic: { min: 50, max: 280, label: 'huyết áp tâm thu' },
  bpDiastolic: { min: 20, max: 180, label: 'huyết áp tâm trương' },
  respiratoryRate: { min: 1, max: 80, label: 'nhịp thở' },
  spo2: { min: 50, max: 100, label: 'SpO2' },
  weightKg: { min: 1, max: 300, label: 'cân nặng' },
  heightCm: { min: 40, max: 250, label: 'chiều cao' },
} as const;

export type VitalField = keyof typeof VITAL_LIMITS;

export const REQUIRED_VITAL_FIELDS = ['pulse', 'bpSystolic', 'bpDiastolic', 'spo2'] as const;

/** Trả về các field bắt buộc còn thiếu, không coi các chỉ số tùy chọn là lỗi. */
export function getMissingRequiredVitalFields(
  values: Partial<Record<(typeof REQUIRED_VITAL_FIELDS)[number], string>>,
): string[] {
  return REQUIRED_VITAL_FIELDS.filter((field) => !values[field]);
}

/** Chuẩn hóa số nhập theo locale Việt Nam và trả null nếu giá trị không hợp lệ. */
export function parseVitalNumber(rawValue: string): number | null {
  const value = rawValue.trim().replace(',', '.');
  if (!value) return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

/** Kiểm tra một chỉ số sinh hiệu theo cùng rule lâm sàng với form doctor. */
export function getVitalFieldError(key: VitalField, value: string): string | undefined {
  const normalizedValue = value.trim();
  const isRequired = REQUIRED_VITAL_FIELDS.includes(key as (typeof REQUIRED_VITAL_FIELDS)[number]);
  if (!normalizedValue) return isRequired ? 'Trường này không được để trống.' : undefined;

  const numberValue = parseVitalNumber(normalizedValue);
  if (numberValue === null) return 'Vui lòng nhập một số hợp lệ.';
  if (key === 'pulse' && (numberValue < 30 || numberValue > 220)) return 'Mạch thường 30–220 bpm.';
  if (key === 'temperatureC' && (numberValue < 34 || numberValue > 43))
    return 'Nhiệt độ hợp lệ khoảng 34–43 °C.';
  if (key === 'bpSystolic' && (numberValue < 50 || numberValue > 280))
    return 'Huyết áp tâm thu không hợp lệ.';
  if (key === 'bpDiastolic' && (numberValue < 20 || numberValue > 180))
    return 'Huyết áp tâm trương không hợp lệ.';
  if (key === 'respiratoryRate' && (numberValue < 1 || numberValue > 80))
    return 'Nhịp thở hợp lệ khoảng 1–80 lần/phút.';
  if (key === 'spo2' && (numberValue < 50 || numberValue > 100))
    return 'SpO2 trong khoảng 50–100%.';
  if (key === 'weightKg' && (numberValue < 1 || numberValue > 300)) return 'Cân nặng không hợp lệ.';
  if (key === 'heightCm' && (numberValue < 40 || numberValue > 250))
    return 'Chiều cao không hợp lệ.';

  return undefined;
}

export type VitalFieldValues = Partial<Record<VitalField, string>>;
export type VitalFieldErrors = Partial<Record<VitalField, string>>;

/**
 * Kiểm tra toàn bộ form sinh hiệu khi người dùng thử lưu.
 *
 * Lỗi từng field được ưu tiên trước lỗi quan hệ huyết áp để không che mất lỗi
 * định dạng hoặc lỗi nằm ngoài khoảng hợp lệ. Backend vẫn phải kiểm tra lại
 * payload vì dữ liệu từ trình duyệt không được xem là đáng tin cậy.
 */
export function getAllVitalFieldErrors(values: VitalFieldValues): VitalFieldErrors {
  const errors: VitalFieldErrors = {};

  (Object.keys(VITAL_LIMITS) as VitalField[]).forEach((field) => {
    const value = values[field] ?? '';
    const formatError = getVitalFieldError(field, value);
    if (formatError) errors[field] = formatError;
  });

  const systolicValue = values.bpSystolic ?? '';
  const diastolicValue = values.bpDiastolic ?? '';
  const bloodPressureError =
    !errors.bpSystolic && !errors.bpDiastolic
      ? getBloodPressureRelationError(systolicValue, diastolicValue)
      : undefined;

  if (bloodPressureError) {
    if (!errors.bpSystolic) errors.bpSystolic = bloodPressureError;
    if (!errors.bpDiastolic) errors.bpDiastolic = bloodPressureError;
  }

  return errors;
}

/** Kiểm tra huyết áp tâm thu phải lớn hơn huyết áp tâm trương như form doctor. */
export function getBloodPressureRelationError(
  systolic: string,
  diastolic: string,
): string | undefined {
  const systolicValue = parseVitalNumber(systolic);
  const diastolicValue = parseVitalNumber(diastolic);
  if (systolicValue === null || diastolicValue === null || systolicValue > diastolicValue) {
    return undefined;
  }

  return 'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.';
}

/** Trả lỗi cho mô tả dị ứng khi nurse bật chế độ ghi nhận dị ứng. */
export function getAllergyNoteError(
  allergyEnabled: boolean,
  allergyNote: string,
  attemptedSave: boolean,
): string | undefined {
  if (!allergyEnabled) return undefined;
  if (allergyNote.length > 1000) return 'Mô tả dị ứng tối đa 1000 ký tự';
  if (attemptedSave && !allergyNote.trim())
    return 'Vui lòng nhập mô tả chi tiết dị ứng trước khi lưu';
  return undefined;
}

/**
 * Xác định form sinh hiệu có còn lỗi chặn lưu hay không.
 * Dùng chung cho nút lưu và phím tắt F9 để UI không chỉ khóa theo lỗi đang hiển thị.
 */
export function hasBlockingVitalFormErrors(
  values: VitalFieldValues,
  allergyEnabled: boolean,
  allergyNote: string,
): boolean {
  const hasFormatErrors = (Object.keys(VITAL_LIMITS) as VitalField[]).some((field) =>
    Boolean(getVitalFieldError(field, values[field] ?? '')),
  );

  return (
    getMissingRequiredVitalFields(values).length > 0 ||
    hasFormatErrors ||
    Boolean(getBloodPressureRelationError(values.bpSystolic ?? '', values.bpDiastolic ?? '')) ||
    Boolean(getAllergyNoteError(allergyEnabled, allergyNote, true))
  );
}

export type EmergencyIdentityInput = {
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
  identityCardNumber: string;
  guardianFullName: string;
  guardianPhoneNumber: string;
  privacyConfirmed: boolean;
};

export type EmergencyIdentityTouched = Partial<Record<keyof EmergencyIdentityInput, boolean>>;

/**
 * Validate form định danh cấp cứu ở client để phản hồi sớm; backend vẫn là nguồn chân lý cuối cùng.
 * Kết quả là map lỗi theo field để UI hiển thị đúng vị trí nhập liệu.
 */
export function validateEmergencyIdentity(input: EmergencyIdentityInput): Record<string, string> {
  const errors: Record<string, string> = {};

  if (input.fullName.trim().length < 3) errors.fullName = 'Họ và tên tối thiểu 3 ký tự';
  if (input.fullName.trim().length > 255) errors.fullName = 'Họ và tên tối đa 255 ký tự';

  if (!input.dateOfBirth) {
    errors.dateOfBirth = 'Vui lòng nhập ngày sinh';
  } else {
    const birthDate = new Date(input.dateOfBirth);
    if (Number.isNaN(birthDate.getTime()) || input.dateOfBirth < '1900-01-01') {
      errors.dateOfBirth = 'Ngày sinh không hợp lệ (phải từ năm 1900 trở về sau)';
    } else if (birthDate > new Date()) {
      errors.dateOfBirth = 'Ngày sinh không được ở tương lai';
    }
  }

  if (!VN_MOBILE_PHONE_REGEX.test(input.phoneNumber)) {
    errors.phoneNumber =
      'Số điện thoại không đúng định dạng di động Việt Nam hợp lệ (VD: 09xxxxxxxx, 03xxxxxxxx)';
  }

  const identityCardNumber = input.identityCardNumber.trim();
  const guardianFullName = input.guardianFullName.trim();
  const guardianPhoneNumber = input.guardianPhoneNumber.trim();
  const hasValidIdentityCard = /^\d{12}$/.test(identityCardNumber);
  const hasCompleteGuardian = Boolean(guardianFullName && guardianPhoneNumber);

  if (identityCardNumber && !hasValidIdentityCard) {
    errors.identityCardNumber = 'Số CCCD phải gồm đúng 12 chữ số';
  }
  if (guardianFullName.length > 255) {
    errors.guardianFullName = 'Họ tên người bảo hộ tối đa 255 ký tự';
  }
  if (guardianPhoneNumber && !VN_MOBILE_PHONE_REGEX.test(guardianPhoneNumber)) {
    errors.guardianPhoneNumber =
      'Số điện thoại người giám hộ không đúng định dạng di động Việt Nam';
  }
  if (!hasValidIdentityCard && !hasCompleteGuardian) {
    errors.identityCardNumber =
      'Cần nhập số CCCD hợp lệ, hoặc nhập đầy đủ họ tên và số điện thoại người giám hộ/đại diện';
  }
  if (!input.privacyConfirmed) {
    errors.privacyConfirmed = 'Cần xác nhận đồng ý trước khi gửi';
  }

  return errors;
}

/**
 * Lọc lỗi định danh cấp cứu theo các field người dùng đã hoàn tất nhập.
 * Lỗi lựa chọn CCCD hoặc người giám hộ được gắn với cả ba field liên quan để
 * phản hồi xuất hiện ngay khi người dùng rời khỏi một phần của cặp thay thế.
 */
export function getVisibleEmergencyIdentityErrors(
  input: EmergencyIdentityInput,
  touchedFields: EmergencyIdentityTouched,
  attemptedSubmit = false,
): Record<string, string> {
  const allErrors = validateEmergencyIdentity(input);
  if (attemptedSubmit) return allErrors;

  const identityAlternativeTouched =
    touchedFields.identityCardNumber ||
    touchedFields.guardianFullName ||
    touchedFields.guardianPhoneNumber;

  return Object.fromEntries(
    Object.entries(allErrors).filter(([field]) => {
      if (field === 'identityCardNumber') return identityAlternativeTouched;
      return Boolean(touchedFields[field as keyof EmergencyIdentityInput]);
    }),
  );
}

/** Lấy message đã được chuẩn hóa từ mutation, không truy cập trực tiếp Axios response trong UI. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.message ? error.message : fallback;
}
