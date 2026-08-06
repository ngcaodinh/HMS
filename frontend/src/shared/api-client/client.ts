import { ApiError, type FieldErrors } from './error';

/** Tùy chọn request cho fetch boundary; body được mã hóa JSON và request luôn không dùng cache. */
type RequestOptions = {
  body?: unknown;
  headers?: HeadersInit;
  method?: string;
  signal?: AbortSignal;
};

/** Các trường lỗi tùy chọn mà BFF/backend có thể đặt trong envelope lỗi. */
type ApiErrorDetail = {
  field?: string;
  message?: string;
  rule?: string;
};

/** Payload lỗi sau khi tách khỏi response JSON; `retryAfterSeconds` dùng đơn vị giây. */
type ApiErrorBody = {
  code?: string;
  details?: ApiErrorDetail[];
  fields?: FieldErrors;
  message?: string;
  retryAfterSeconds?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

const normalizeFieldMap = (fields: unknown): FieldErrors | undefined => {
  if (!isRecord(fields)) return undefined;

  const normalizedFields = Object.entries(fields).reduce<FieldErrors>(
    (currentFields, [field, messages]) => {
      if (!Array.isArray(messages)) return currentFields;

      const normalizedMessages = messages.filter(
        (message): message is string => typeof message === 'string',
      );

      if (!normalizedMessages.length) return currentFields;

      return {
        ...currentFields,
        [field]: normalizedMessages,
      };
    },
    {},
  );

  return Object.keys(normalizedFields).length > 0 ? normalizedFields : undefined;
};

// Chuyển danh sách detail của backend thành map field để form dùng chung một contract lỗi.
const normalizeDetailFields = (details: unknown): FieldErrors | undefined => {
  if (!Array.isArray(details)) return undefined;

  const fields = details.reduce<FieldErrors>((currentFields, detail) => {
    if (!isRecord(detail) || typeof detail.field !== 'string') return currentFields;

    const message =
      typeof detail.rule === 'string'
        ? detail.rule
        : typeof detail.message === 'string'
          ? detail.message
          : 'Dữ liệu không hợp lệ';

    return {
      ...currentFields,
      [detail.field]: [...(currentFields[detail.field] ?? []), message],
    };
  }, {});

  return Object.keys(fields).length > 0 ? fields : undefined;
};

// Giữ tương thích hai dạng lỗi: field map trực tiếp và danh sách detail theo field.
const normalizeErrorFields = (error: ApiErrorBody | undefined): FieldErrors | undefined => {
  const fields = normalizeFieldMap(error?.fields);
  if (fields) return fields;

  return normalizeDetailFields(error?.details);
};

/** Đọc response JSON; response không parse được trở thành ApiError để caller xử lý thống nhất. */
const parseJsonPayload = (text: string, status: number) => {
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError({
      code: 'INVALID_RESPONSE',
      message: 'Phản hồi từ hệ thống không hợp lệ',
      status,
    });
  }
};

/**
 * Fetch boundary phía client cho các route same-origin, thường là BFF `/api/*`.
 * @param path Đường dẫn route frontend; không phải backend origin trực tiếp.
 * @param options Method, body JSON, header bổ sung và signal hủy request nếu caller cung cấp.
 * @returns Chỉ phần `data` của success envelope sau khi kiểm tra response.
 * @throws ApiError cho lỗi mạng, HTTP, JSON không hợp lệ hoặc envelope thiếu `data`; lỗi abort
 * được giữ nguyên để caller phân biệt hủy request với lỗi hệ thống.
 * @remarks Request gửi kèm cookie phiên theo chính sách same-origin; boundary không retry và
 * không tự hiển thị lỗi, còn UI quyết định cách hiển thị hoặc điều hướng.
 */
export const apiClient = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(path, {
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      method: options.method ?? 'GET',
      signal: options.signal,
    });
  } catch (caught) {
    if (isAbortError(caught)) throw caught;

    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: 'Không thể kết nối tới hệ thống',
      status: 0,
    });
  }

  const text = await response.text();
  const payload = parseJsonPayload(text, response.status);
  const error =
    isRecord(payload) && isRecord(payload.error) ? (payload.error as ApiErrorBody) : undefined;

  if (!response.ok || error) {
    throw new ApiError({
      code: error?.code ?? 'REQUEST_FAILED',
      fields: normalizeErrorFields(error),
      message: error?.message ?? 'Yêu cầu không thành công',
      retryAfterSeconds:
        typeof error?.retryAfterSeconds === 'number' && Number.isInteger(error.retryAfterSeconds)
          ? Math.max(0, error.retryAfterSeconds)
          : undefined,
      status: response.status,
    });
  }

  if (!isRecord(payload) || !('data' in payload)) {
    throw new ApiError({
      code: 'INVALID_RESPONSE',
      message: 'Phản hồi từ hệ thống không đúng hợp đồng',
      status: response.status,
    });
  }

  return payload.data as T;
};
