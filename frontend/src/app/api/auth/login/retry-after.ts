type RetryAfterPayload = {
  error?: Record<string, unknown>;
  [key: string]: unknown;
};

type RetryAfterResult = {
  payload: unknown;
  retryAfterSeconds?: number;
};

const isRetryAfterPayload = (value: unknown): value is RetryAfterPayload =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Chuẩn hóa Retry-After của backend vào error envelope để client hiển thị countdown an toàn.
 * Chỉ chấp nhận số nguyên không âm và payload lỗi đúng cấu trúc; dữ liệu khác được giữ nguyên.
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
