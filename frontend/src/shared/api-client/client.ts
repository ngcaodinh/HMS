import { ApiError } from './error';

type RequestOptions = {
  body?: unknown;
  headers?: HeadersInit;
  method?: string;
  signal?: AbortSignal;
};

export const apiClient = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const response = await fetch(path, {
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

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok || payload?.error) {
    const error = payload?.error;

    throw new ApiError({
      code: error?.code ?? 'REQUEST_FAILED',
      fields: error?.fields,
      message: error?.message ?? 'Yêu cầu không thành công',
      status: response.status,
    });
  }

  return payload?.data as T;
};
