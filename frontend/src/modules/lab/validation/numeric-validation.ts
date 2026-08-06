/** Giới hạn số thập phân theo nhãn hiển thị và precision/scale của dữ liệu xét nghiệm. */
export interface DecimalRule {
  label: string;
  max?: number;
  min: number;
  precision: number;
  scale: number;
}

/**
 * Kiểm tra một giá trị thập phân theo giới hạn vật lý và precision/scale của cột DB.
 * Giá trị rỗng được coi là hợp lệ vì các chỉ số xét nghiệm đều là optional.
 */
export function getDecimalFieldError(value: unknown, rule: DecimalRule): string | undefined {
  if (value === undefined || value === null || String(value).trim() === '') return undefined;

  const normalized = String(value).trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return `${rule.label} phải là số hợp lệ.`;

  const unsigned = normalized.startsWith('-') ? normalized.slice(1) : normalized;
  const [integerPart, fractionPart = ''] = unsigned.split('.');
  if (
    integerPart.length + fractionPart.length > rule.precision ||
    fractionPart.length > rule.scale
  ) {
    return `${rule.label} vượt quá độ chính xác cho phép.`;
  }

  const numericValue = Number(normalized);
  if (!Number.isFinite(numericValue)) return `${rule.label} phải là số hợp lệ.`;
  if (numericValue < rule.min) return `${rule.label} phải lớn hơn hoặc bằng ${rule.min}.`;
  if (rule.max !== undefined && numericValue > rule.max) {
    return `${rule.label} phải nhỏ hơn hoặc bằng ${rule.max}.`;
  }

  return undefined;
}

/** Áp dụng cùng một bộ rule cho object kết quả và chỉ trả về lỗi theo field bị sai. */
export function getDecimalFieldErrors(
  value: Record<string, unknown>,
  rules: Record<string, DecimalRule>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const error = getDecimalFieldError(value[field], rule);
    if (error) errors[field] = error;
  }

  return errors;
}
