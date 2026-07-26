import { ApiError, type FieldErrors } from './error';

type RequestOptions = {
  body?: unknown;
  headers?: HeadersInit;
  method?: string;
  signal?: AbortSignal;
};

type ApiErrorDetail = {
  field?: string;
  message?: string;
  rule?: string;
};

type ApiErrorBody = {
  code?: string;
  details?: ApiErrorDetail[];
  fields?: FieldErrors;
  message?: string;
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

      const normalizedMessages = messages.filter((message): message is string =>
        typeof message === 'string',
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

const normalizeDetailFields = (details: unknown): FieldErrors | undefined => {
  if (!Array.isArray(details)) return undefined;

  const fields = details.reduce<FieldErrors>((currentFields, detail) => {
    if (!isRecord(detail) || typeof detail.field !== 'string') return currentFields;

    const message = typeof detail.message === 'string' ? detail.message : 'Dữ liệu không hợp lệ';

    return {
      ...currentFields,
      [detail.field]: [...(currentFields[detail.field] ?? []), message],
    };
  }, {});

  return Object.keys(fields).length > 0 ? fields : undefined;
};

const normalizeErrorFields = (error: ApiErrorBody | undefined): FieldErrors | undefined => {
  const fields = normalizeFieldMap(error?.fields);
  if (fields) return fields;

  return normalizeDetailFields(error?.details);
};

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
 * Fetch boundary duy nhất phía client: gửi credential, parse envelope và chuẩn hóa lỗi.
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
  const error = isRecord(payload) && isRecord(payload.error)
    ? (payload.error as ApiErrorBody)
    : undefined;

  if (!response.ok || error) {
    throw new ApiError({
      code: error?.code ?? 'REQUEST_FAILED',
      fields: normalizeErrorFields(error),
      message: error?.message ?? 'Yêu cầu không thành công',
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
