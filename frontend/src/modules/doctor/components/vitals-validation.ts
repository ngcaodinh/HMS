export type VitalField =
  | 'pulse'
  | 'temperatureC'
  | 'bloodPressureSystolic'
  | 'bloodPressureDiastolic'
  | 'respiratoryRate'
  | 'spo2'
  | 'weightKg'
  | 'heightCm';

export interface BloodPressureFormValues {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
}

/** Chuẩn hóa số nhập theo locale Việt Nam và trả null nếu giá trị không phải số hữu hạn. */
export function parseVitalNumber(rawValue: string): number | null {
  const value = rawValue.trim().replace(',', '.');
  if (!value) return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

/** Kiểm tra một trường sinh hiệu theo yêu cầu bắt buộc và khoảng giá trị lâm sàng. */
export function validateVitalField(field: VitalField, rawValue: string): string {
  const value = rawValue.trim();
  const isRequired =
    field === 'pulse' ||
    field === 'bloodPressureSystolic' ||
    field === 'bloodPressureDiastolic' ||
    field === 'spo2';

  if (!value) return isRequired ? 'Trường này không được để trống.' : '';

  const numberValue = parseVitalNumber(value);
  if (numberValue === null) return 'Vui lòng nhập một số hợp lệ.';
  if (field === 'pulse' && (numberValue < 30 || numberValue > 220))
    return 'Mạch thường 30–220 bpm.';
  if (field === 'temperatureC' && (numberValue < 34 || numberValue > 43))
    return 'Nhiệt độ hợp lệ khoảng 34–43 °C.';
  if (field === 'bloodPressureSystolic' && (numberValue < 50 || numberValue > 280))
    return 'Huyết áp tâm thu không hợp lệ.';
  if (field === 'bloodPressureDiastolic' && (numberValue < 20 || numberValue > 180))
    return 'Huyết áp tâm trương không hợp lệ.';
  if (field === 'respiratoryRate' && (numberValue < 1 || numberValue > 80))
    return 'Nhịp thở hợp lệ khoảng 1–80 lần/phút.';
  if (field === 'spo2' && (numberValue < 50 || numberValue > 100))
    return 'SpO2 trong khoảng 50–100%.';
  if (field === 'weightKg' && (numberValue < 1 || numberValue > 300))
    return 'Cân nặng không hợp lệ.';
  if (field === 'heightCm' && (numberValue < 40 || numberValue > 250))
    return 'Chiều cao không hợp lệ.';

  return '';
}

/** Kiểm tra HA tâm thu phải lớn hơn HA tâm trương sau mỗi lần người dùng sửa giá trị. */
export function validateBloodPressure(
  form: BloodPressureFormValues,
): Partial<Record<keyof BloodPressureFormValues, string>> {
  const systolic = parseVitalNumber(form.bloodPressureSystolic);
  const diastolic = parseVitalNumber(form.bloodPressureDiastolic);
  if (systolic === null || diastolic === null || systolic > diastolic) return {};

  const message = 'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.';
  return { bloodPressureSystolic: message, bloodPressureDiastolic: message };
}
