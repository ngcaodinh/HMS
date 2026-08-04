import { type AxiosError } from 'axios';

import { httpClient } from './http-client';

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; rule: string; message?: string }>;
    requestId?: string;
  };
};

export type ApiSuccess<T> = {
  data: T;
  meta?: {
    requestId?: string;
    occurredAt?: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

/**
 * Axios instance dùng BFF proxy để trình duyệt không giữ access token trực tiếp.
 */
export const apiClient = httpClient;

/**
 * Trích message lỗi theo contract API v1 để UI hiển thị phản hồi thống nhất.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi'): string {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError.response?.data?.error?.message ?? fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError.response?.data?.error?.code;
}
