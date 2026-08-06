/**
 * Chọn nguồn billing mà lớp gọi cờ này sẽ sử dụng.
 * Mặc định là API billing thật; chỉ chuyển sang nhánh fallback khi biến môi trường có giá trị
 * chính xác là `false` hoặc `0`.
 *
 * @remarks Cờ này chỉ chọn nguồn dữ liệu/transport, không cấp quyền và không thay thế việc server
 * kiểm tra trạng thái hóa đơn, số tiền hoặc tỷ lệ giảm BHYT.
 */
export const USE_REAL_BILLING =
  process.env.NEXT_PUBLIC_USE_REAL_BILLING !== 'false' &&
  process.env.NEXT_PUBLIC_USE_REAL_BILLING !== '0';

/**
 * ID hồ sơ bệnh án seed cho môi trường billing phát triển.
 * Có thể ghi đè bằng `NEXT_PUBLIC_BILLING_RECORD_ID`; giá trị fallback là UUID seed ẩn danh,
 * không phải mã định danh bệnh nhân thật.
 */
export const DEV_BILLING_RECORD_ID =
  process.env.NEXT_PUBLIC_BILLING_RECORD_ID ??
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
