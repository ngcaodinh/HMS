/**
 * Chuyển thời điểm hết hạn JWT thành thời lượng cookie; giá trị không hợp lệ sẽ fail closed.
 * `nowMilliseconds` cho phép kiểm thử ranh giới thời gian mà không phụ thuộc đồng hồ hệ thống.
 */
export const getSessionMaxAge = (expiresAt: unknown, nowMilliseconds = Date.now()) => {
  if (typeof expiresAt !== 'string') return 0;

  const expiresAtMilliseconds = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtMilliseconds)) return 0;

  return Math.max(0, Math.floor((expiresAtMilliseconds - nowMilliseconds) / 1000));
};
