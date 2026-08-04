/**
 * Lọc input tiền VND ngay khi gõ để state luôn chứa chuỗi chữ số, không cho chèn ký tự lạ.
 */
export function sanitizeVndInput(value: string): string {
  return value.replace(/\D/g, '');
}

/** Định dạng chuỗi chữ số theo locale Việt Nam mà không làm thay đổi giá trị nguyên. */
export function formatVndInput(value: string): string {
  const digits = sanitizeVndInput(value);
  if (!digits) return '';

  return Number(digits).toLocaleString('vi-VN');
}

/** Parse số tiền VND dương; trả null để form hiển thị lỗi tại chỗ khi dữ liệu không hợp lệ. */
export function parsePositiveVnd(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}
