import { ApiError } from '@/shared/api-client/error';

/**
 * Mẫu số điện thoại di động Việt Nam gồm 10 chữ số, không có khoảng trắng hay dấu phân cách.
 * Đây chỉ là kiểm tra sớm ở client; backend vẫn là nguồn kiểm tra cuối cùng trước khi lưu.
 */
export const VN_MOBILE_PHONE_REGEX = /^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-9])[0-9]{7}$/;

/**
 * Khoảng kiểm tra đầu vào phía client cho sinh hiệu và thể trạng.
 * Đơn vị lần lượt là bpm, °C, mmHg, lần/phút, %, kg và cm; backend vẫn phải kiểm tra lại payload.
 */
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

/** Các key sinh hiệu được suy ra trực tiếp từ bảng giới hạn và dùng làm input cho các helper. */
export type VitalField = keyof typeof VITAL_LIMITS;

/** Các field sinh hiệu bắt buộc khi lưu; nhiệt độ, nhịp thở, cân nặng và chiều cao là tùy chọn. */
export const REQUIRED_VITAL_FIELDS = ['pulse', 'bpSystolic', 'bpDiastolic', 'spo2'] as const;

/**
 * Tìm các field sinh hiệu bắt buộc còn trống trong dữ liệu thô của form.
 * @param values Map giá trị chuỗi theo field bắt buộc; giá trị chưa chuẩn hóa được giữ nguyên.
 * @returns Danh sách key còn thiếu; các field tùy chọn không xuất hiện trong kết quả.
 */
export function getMissingRequiredVitalFields(
  values: Partial<Record<(typeof REQUIRED_VITAL_FIELDS)[number], string>>,
): string[] {
  return REQUIRED_VITAL_FIELDS.filter((field) => !values[field]);
}

/**
 * Chuẩn hóa số nhập theo quy ước dấu phẩy của locale Việt Nam.
 * @param rawValue Giá trị chuỗi từ input, có thể chứa khoảng trắng hoặc dấu phẩy thập phân.
 * @returns Số hữu hạn sau chuẩn hóa, hoặc `null` nếu input rỗng/không phải số.
 */
export function parseVitalNumber(rawValue: string): number | null {
  const value = rawValue.trim().replace(',', '.');
  if (!value) return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

/**
 * Kiểm tra một field sinh hiệu theo cùng khoảng lâm sàng với form doctor.
 * @param key Key sinh hiệu cần kiểm tra; khoảng và đơn vị tương ứng nằm trong `VITAL_LIMITS`.
 * @param value Giá trị chuỗi hiện tại của input.
 * @returns Message lỗi để hiển thị tại field, hoặc `undefined` khi hợp lệ/chưa bắt buộc nhập.
 * @remarks Đây là guard UX phía client, không thay thế validation và authorization của backend.
 */
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

/** Giá trị chuỗi thô của các field sinh hiệu; field tùy chọn có thể chưa tồn tại trong map. */
export type VitalFieldValues = Partial<Record<VitalField, string>>;

/** Map lỗi hiển thị theo key sinh hiệu sau khi chạy validation toàn form. */
export type VitalFieldErrors = Partial<Record<VitalField, string>>;

/**
 * Kiểm tra toàn bộ form sinh hiệu khi người dùng thử lưu.
 *
 * Lỗi từng field được ưu tiên trước lỗi quan hệ huyết áp để không che mất lỗi
 * định dạng hoặc lỗi nằm ngoài khoảng hợp lệ. Backend vẫn phải kiểm tra lại
 * payload vì dữ liệu từ trình duyệt không được xem là đáng tin cậy.
 * @param values Giá trị chuỗi thô của toàn bộ field sinh hiệu.
 * @returns Map lỗi theo field; map rỗng nghĩa là không có lỗi chặn từ các rule hiện tại.
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

/**
 * Kiểm tra quan hệ huyết áp tâm thu/tâm trương sau khi đã parse số.
 * @param systolic Huyết áp tâm thu dạng chuỗi, đơn vị mmHg.
 * @param diastolic Huyết áp tâm trương dạng chuỗi, đơn vị mmHg.
 * @returns Message lỗi khi tâm thu không lớn hơn tâm trương, hoặc `undefined` khi chưa đủ số.
 */
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

/**
 * Kiểm tra ghi chú dị ứng khi điều dưỡng bật chế độ ghi nhận dị ứng.
 * @param allergyEnabled Cho biết form có yêu cầu ghi nhận dị ứng hay không.
 * @param allergyNote Mô tả dị ứng; giới hạn tối đa là 1.000 ký tự.
 * @param attemptedSave Cho biết người dùng đã thử lưu để áp dụng lỗi bắt buộc nhập.
 * @returns Message lỗi hiển thị, hoặc `undefined` khi chưa vi phạm guard phía client.
 */
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
 * @param values Giá trị chuỗi hiện tại của form sinh hiệu.
 * @param allergyEnabled Cho biết có áp dụng rule bắt buộc ghi chú dị ứng hay không.
 * @param allergyNote Mô tả dị ứng đang nhập, giới hạn 1.000 ký tự.
 * @returns `true` khi còn lỗi chặn thao tác lưu phía client.
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

/**
 * Dữ liệu thô của form chuẩn hóa danh tính cấp cứu; `dateOfBirth` dùng định dạng `YYYY-MM-DD`.
 * Cặp CCCD 12 chữ số hoặc họ tên và số điện thoại người giám hộ là hai lựa chọn thay thế.
 */
export type EmergencyIdentityInput = {
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
  identityCardNumber: string;
  guardianFullName: string;
  guardianPhoneNumber: string;
  privacyConfirmed: boolean;
};

/** Cờ cho biết field định danh cấp cứu đã được người dùng tương tác để lọc lỗi hiển thị. */
export type EmergencyIdentityTouched = Partial<Record<keyof EmergencyIdentityInput, boolean>>;

/**
 * Kiểm tra form định danh cấp cứu ở client để phản hồi sớm trước khi gửi mutation.
 * @param input Dữ liệu thô từ form, gồm thông tin chính và lựa chọn định danh thay thế.
 * @returns Map message lỗi theo field để UI hiển thị đúng vị trí nhập liệu.
 * @remarks Ngày sinh phải từ năm 1900 và không ở tương lai; backend vẫn là nguồn kiểm tra cuối.
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
 * Lỗi lựa chọn CCCD hoặc người giám hộ vẫn dùng key `identityCardNumber`, nhưng được hiển thị
 * ngay khi người dùng chạm vào bất kỳ field nào trong nhóm thay thế.
 * @param input Dữ liệu định danh hiện tại của form.
 * @param touchedFields Map field đã được tương tác.
 * @param attemptedSubmit Khi `true`, trả toàn bộ lỗi thay vì lọc theo touched state.
 * @returns Map lỗi được phép hiển thị ở thời điểm hiện tại.
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

/**
 * Lấy message an toàn từ `ApiError` để UI không phải đọc trực tiếp Axios response.
 * @param error Lỗi chưa biết kiểu từ query hoặc mutation.
 * @param fallback Message dự phòng khi lỗi không phải `ApiError` có message.
 * @returns Message có thể hiển thị cho người dùng.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.message ? error.message : fallback;
}
