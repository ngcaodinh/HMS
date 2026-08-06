/**
 * Lọc dữ liệu gõ vào trường số tiền tạm ứng để state chỉ còn chuỗi chữ số.
 *
 * @param value - Chuỗi hiện tại của ô nhập tạm ứng, có thể chứa dấu phân cách hoặc ký tự lạ.
 * @returns Chuỗi chữ số chưa được parse; hàm không làm tròn và không quyết định số tiền hóa đơn
 *   hay số tiền/tỷ lệ giảm BHYT.
 */
export function sanitizeVndInput(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Định dạng chuỗi chữ số của khoản tạm ứng theo locale Việt Nam để hiển thị.
 *
 * @param value - Chuỗi chữ số đang được giữ trong state của form tạm ứng.
 * @returns Chuỗi có dấu phân cách hàng nghìn; không phải giá trị gửi API và không tự tính hóa đơn.
 * @remarks Nếu chuỗi vượt miền số nguyên an toàn của JavaScript, bước parse sẽ từ chối giá trị đó.
 */
export function formatVndInput(value: string): string {
  const digits = sanitizeVndInput(value);
  if (!digits) return '';

  return Number(digits).toLocaleString('vi-VN');
}

/**
 * Parse số tiền tạm ứng VNĐ thành số nguyên dương an toàn cho request.
 *
 * @param value - Chuỗi chữ số đã được lọc từ ô nhập tạm ứng.
 * @returns Số nguyên VNĐ dương hoặc `null` nếu sai định dạng, vượt miền an toàn hay không dương.
 * @remarks Đây chỉ là kiểm tra sớm ở client; server vẫn xác thực lại khoản tạm ứng. Quy tắc này
 *   không cho phép client tự nhập số tiền hoặc tỷ lệ giảm BHYT trên hóa đơn.
 */
export function parsePositiveVnd(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}
