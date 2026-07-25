import axios, { type AxiosError } from 'axios';

import { env } from '../constants/env';

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; rule: string }>;
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
 * Axios instance gọi Backend /api/v1.
 */
export const apiClient = axios.create({
  baseURL: `${env.apiUrl}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('hms_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * Trích message lỗi contract v1.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi'): string {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError.response?.data?.error?.message ?? fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError.response?.data?.error?.code;
}
