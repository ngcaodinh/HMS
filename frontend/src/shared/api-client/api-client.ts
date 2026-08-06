import { type AxiosError } from 'axios';

import { httpClient } from './http-client';

/** Hợp đồng envelope lỗi mà backend trả về cho các adapter Axios. */
export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; rule: string; message?: string }>;
    requestId?: string;
  };
};

/**
 * Envelope thành công của API v1; adapter Axios giữ lại `data` và metadata để caller quyết định
 * có cần dùng phân trang hay không.
 */
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
 * Axios instance đi qua BFF/proxy cùng origin; trình duyệt không gọi trực tiếp backend origin.
 */
export const apiClient = httpClient;

/**
 * Trích message từ envelope lỗi của Axios để UI có một nội dung hiển thị thống nhất.
 * @param error Lỗi chưa được biết kiểu, thường là lỗi từ request Axios.
 * @param fallback Nội dung dự phòng khi response không có message hợp lệ.
 * @returns Message backend hoặc fallback đã chọn.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi'): string {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError.response?.data?.error?.message ?? fallback;
}

/** Lấy mã lỗi ổn định từ envelope Axios; trả `undefined` nếu lỗi không có response hợp lệ. */
export function getApiErrorCode(error: unknown): string | undefined {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError.response?.data?.error?.code;
}

/**
 * Lấy danh sách lỗi theo field từ envelope Axios; trả mảng rỗng để UI không phải kiểm tra null.
 */
export function getApiErrorDetails(
  error: unknown,
): Array<{ field: string; rule: string; message?: string }> {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError.response?.data?.error?.details ?? [];
}
