import { ApiError } from '@/shared/api-client/error';

export const VN_MOBILE_PHONE_REGEX = /^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-9])[0-9]{7}$/;

export const VITAL_LIMITS = {
  pulse: {
    min: 1,
    max: 300,
    label: 'mạch',
    message: 'Mạch phải trong khoảng 1-300 lần/phút',
    integer: true,
  },
  temperatureC: { min: 25, max: 45, label: 'nhiệt độ' },
  bpSystolic: {
    min: 1,
    max: 300,
    label: 'huyết áp tâm thu',
    message: 'Huyết áp tâm thu phải trong khoảng 1-300 mmHg',
    integer: true,
  },
  bpDiastolic: {
    min: 1,
    max: 200,
    label: 'huyết áp tâm trương',
    message: 'Huyết áp tâm trương phải trong khoảng 1-200 mmHg',
    integer: true,
  },
  respiratoryRate: {
    min: 1,
    max: 100,
    label: 'nhịp thở',
    message: 'Nhịp thở phải trong khoảng 1-100 lần/phút',
    integer: true,
  },
  spo2: { min: 0, max: 100, label: 'SpO2', integer: true },
  heightCm: {
    min: 0.1,
    max: 300,
    label: 'chiều cao',
    message: 'Chiều cao phải lớn hơn 0 và không quá 300cm',
  },
  weightKg: {
    min: 0.1,
    max: 500,
    label: 'cân nặng',
    message: 'Cân nặng phải lớn hơn 0 và không quá 500kg',
  },
} as const;

export type VitalField = keyof typeof VITAL_LIMITS;

export const REQUIRED_VITAL_FIELDS = ['pulse', 'bpSystolic', 'bpDiastolic', 'spo2'] as const;

/** Trả về các field bắt buộc còn thiếu, không coi các chỉ số tùy chọn là lỗi. */
export function getMissingRequiredVitalFields(
  values: Partial<Record<(typeof REQUIRED_VITAL_FIELDS)[number], string>>,
): string[] {
  return REQUIRED_VITAL_FIELDS.filter((field) => !values[field]);
}

/** Kiểm tra một chỉ số sinh hiệu theo cùng boundary mà backend áp dụng. */
export function getVitalFieldError(key: VitalField, value: string): string | undefined {
  const normalizedValue = value.trim();
  if (!normalizedValue) return undefined;

  const limit = VITAL_LIMITS[key];
  const numberValue = Number(normalizedValue);
  const isInvalidInteger = 'integer' in limit && limit.integer && !Number.isInteger(numberValue);
  if (
    Number.isNaN(numberValue) ||
    isInvalidInteger ||
    numberValue < limit.min ||
    numberValue > limit.max
  ) {
    return 'message' in limit
      ? limit.message
      : `Giá trị ${limit.label} không hợp lệ (${limit.min}-${limit.max})`;
  }

  return undefined;
}

export type VitalFieldValues = Partial<Record<VitalField, string>>;
export type VitalFieldTouched = Partial<Record<VitalField, boolean>>;
export type VitalFieldErrors = Partial<Record<VitalField, string>>;

/**
 * Chỉ hiển thị lỗi sinh hiệu sau khi người dùng rời khỏi field hoặc đã thử lưu.
 *
 * Quy tắc liên trường của huyết áp được áp dụng cho cả tâm thu và tâm trương để
 * người dùng luôn biết cặp giá trị nào cần kiểm tra lại. Backend vẫn phải kiểm tra
 * lại payload vì dữ liệu từ trình duyệt không được xem là đáng tin cậy.
 */
export function getVisibleVitalFieldErrors(
  values: VitalFieldValues,
  touchedFields: VitalFieldTouched,
  attemptedSave = false,
): VitalFieldErrors {
  const errors: VitalFieldErrors = {};

  (Object.keys(VITAL_LIMITS) as VitalField[]).forEach((field) => {
    if (!attemptedSave && !touchedFields[field]) return;

    const value = values[field] ?? '';
    const formatError = getVitalFieldError(field, value);
    if (formatError) {
      errors[field] = formatError;
      return;
    }

    if (
      REQUIRED_VITAL_FIELDS.includes(field as (typeof REQUIRED_VITAL_FIELDS)[number]) &&
      !value.trim()
    ) {
      errors[field] = 'Vui lòng nhập giá trị này';
    }
  });

  const shouldValidateBloodPressure =
    attemptedSave || touchedFields.bpSystolic || touchedFields.bpDiastolic;
  const systolicValue = values.bpSystolic ?? '';
  const diastolicValue = values.bpDiastolic ?? '';
  const bloodPressureError =
    shouldValidateBloodPressure &&
    !getVitalFieldError('bpSystolic', systolicValue) &&
    !getVitalFieldError('bpDiastolic', diastolicValue)
      ? getBloodPressureRelationError(systolicValue, diastolicValue)
      : undefined;

  if (bloodPressureError) {
    if (!errors.bpSystolic) errors.bpSystolic = bloodPressureError;
    if (!errors.bpDiastolic) errors.bpDiastolic = bloodPressureError;
  }

  return errors;
}

/** Chặn huyết áp tâm thu nhỏ hơn hoặc bằng tâm trương để tránh nhập ngược. */
export function getBloodPressureRelationError(
  systolic: string,
  diastolic: string,
): string | undefined {
  const normalizedSystolic = systolic.trim();
  const normalizedDiastolic = diastolic.trim();
  if (!normalizedSystolic || !normalizedDiastolic) return undefined;

  const systolicValue = Number(normalizedSystolic);
  const diastolicValue = Number(normalizedDiastolic);
  if (Number.isNaN(systolicValue) || Number.isNaN(diastolicValue)) return undefined;

  return systolicValue > diastolicValue
    ? undefined
    : 'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương, vui lòng kiểm tra lại (có thể đã nhập ngược)';
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
