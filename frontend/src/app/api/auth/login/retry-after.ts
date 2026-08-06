/** Payload lỗi có thể được bổ sung `retryAfterSeconds` mà vẫn giữ các field khác nguyên vẹn. */
type RetryAfterPayload = {
  error?: Record<string, unknown>;
  [key: string]: unknown;
};

/** Kết quả chuẩn hóa payload và số giây retry hợp lệ nếu response là 429. */
type RetryAfterResult = {
  payload: unknown;
  retryAfterSeconds?: number;
};

/** Thu hẹp unknown về object JSON có thể chứa error envelope. */
const isRetryAfterPayload = (value: unknown): value is RetryAfterPayload =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Chuẩn hóa Retry-After của backend vào error envelope để client hiển thị countdown an toàn.
 * Chỉ chấp nhận số nguyên không âm và payload lỗi đúng cấu trúc; dữ liệu khác được giữ nguyên.
 *
 * @param payload Payload JSON từ backend, được giữ nguyên nếu không đủ điều kiện bổ sung.
 * @param status HTTP status của response backend.
 * @param retryAfterHeader Giá trị header `Retry-After`, tính bằng giây khi hợp lệ.
 * @returns Payload đã bổ sung số giây retry và giá trị header chuẩn hóa nếu là HTTP 429.
 */
export const addRetryAfterToPayload = (
  payload: unknown,
  status: number,
  retryAfterHeader: string | null,
): RetryAfterResult => {
  const normalizedHeader = retryAfterHeader?.trim();
  const retryAfterSeconds =
    normalizedHeader && /^\d+$/.test(normalizedHeader) ? Number(normalizedHeader) : NaN;

  if (
    status !== 429 ||
    !Number.isSafeInteger(retryAfterSeconds) ||
    !isRetryAfterPayload(payload) ||
    !isRetryAfterPayload(payload.error)
  ) {
    return { payload };
  }

  return {
    payload: {
      ...payload,
      error: {
        ...payload.error,
        retryAfterSeconds,
      },
    },
    retryAfterSeconds,
  };
};
