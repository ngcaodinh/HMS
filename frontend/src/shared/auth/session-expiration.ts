/**
 * Chuyển chuỗi thời điểm hết hạn thành thời lượng cookie tính bằng giây.
 * Giá trị không hợp lệ hoặc đã hết hạn trả `0` để fail closed; `nowMilliseconds` dùng đơn vị
 * milliseconds từ Unix epoch và cho phép kiểm thử ranh giới thời gian độc lập với đồng hồ hệ thống.
 * @param expiresAt Chuỗi thời điểm mà `Date.parse` có thể đọc được.
 * @param nowMilliseconds Thời điểm hiện tại tính bằng milliseconds, mặc định là đồng hồ hệ thống.
 * @returns Số giây nguyên không âm còn lại của phiên.
 */
export const getSessionMaxAge = (expiresAt: unknown, nowMilliseconds = Date.now()) => {
  if (typeof expiresAt !== 'string') return 0;

  const expiresAtMilliseconds = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtMilliseconds)) return 0;

  return Math.max(0, Math.floor((expiresAtMilliseconds - nowMilliseconds) / 1000));
};
