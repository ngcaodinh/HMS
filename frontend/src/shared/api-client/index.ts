import type { AxiosRequestConfig } from 'axios';

import { httpClient } from './http-client';

export { apiClient } from './client';
export { ApiError } from './error';
export type { FieldErrors } from './error';
export { ApiError as HttpApiError } from './api-error';
export { httpClient } from './http-client';

interface SuccessEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

interface PaginatedEnvelope<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.get<SuccessEnvelope<T>>(url, config);
  return response.data.data;
}

export async function apiGetPaginated<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<PaginatedEnvelope<T>> {
  const response = await httpClient.get<PaginatedEnvelope<T>>(url, config);
  return response.data;
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await httpClient.post<SuccessEnvelope<T>>(url, body, config);
  return response.data.data;
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await httpClient.patch<SuccessEnvelope<T>>(url, body, config);
  return response.data.data;
}

export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await httpClient.put<SuccessEnvelope<T>>(url, body, config);
  return response.data.data;
}

export async function apiDelete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.delete<SuccessEnvelope<T>>(url, config);
  return response.data.data;
}

export async function apiPostMultipart<T>(
  url: string,
  body: FormData,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await httpClient.post<SuccessEnvelope<T>>(url, body, {
    ...config,
    headers: {
      ...config?.headers,
    },
  });
  return response.data.data;
}
