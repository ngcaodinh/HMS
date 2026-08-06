import axios from 'axios';

import { ApiError, type FieldErrors } from './error';

type ApiErrorDetail = {
  field?: string;
  rule?: string;
  message?: string;
};

/** Envelope lỗi tối thiểu mà BFF chuyển tiếp từ backend cho Axios adapter. */
type EnvelopeError = {
  code?: string;
  details?: ApiErrorDetail[];
  fields?: FieldErrors;
  message?: string;
};

/** Chuyển danh sách detail của backend thành map field để form dùng chung một contract lỗi. */
const normalizeDetailFields = (details: unknown): FieldErrors | undefined => {
  if (!Array.isArray(details)) return undefined;

  const fields = details.reduce<FieldErrors>((currentFields, detail) => {
    if (typeof detail !== 'object' || detail === null || !('field' in detail)) {
      return currentFields;
    }

    const field = detail.field;
    if (typeof field !== 'string') return currentFields;

    const message =
      'rule' in detail && typeof detail.rule === 'string'
        ? detail.rule
        : 'message' in detail && typeof detail.message === 'string'
          ? detail.message
          : 'Dữ liệu không hợp lệ';

    return {
      ...currentFields,
      [field]: [...(currentFields[field] ?? []), message],
    };
  }, {});

  return Object.keys(fields).length > 0 ? fields : undefined;
};

// Chuyển lỗi envelope của Axios về ApiError để UI bắt cùng một kiểu bằng instanceof.
const createApiError = (error: unknown) => {
  const response = axios.isAxiosError(error) ? error.response : undefined;
  const envelopeError = response?.data?.error as EnvelopeError | undefined;

  if (!envelopeError) return error;

  return new ApiError({
    code: envelopeError.code ?? 'REQUEST_FAILED',
    fields: envelopeError.fields ?? normalizeDetailFields(envelopeError.details),
    message: envelopeError.message ?? 'Yêu cầu không thành công',
    status: response?.status ?? 0,
  });
};

/**
 * Axios instance cùng origin trỏ tới Next.js BFF `/api/proxy`.
 * @remarks BFF chịu trách nhiệm nối request với backend và áp dụng session server-side; client
 * không gọi backend origin trực tiếp. Interceptor chỉ chuẩn hóa lỗi có envelope `error`, còn
 * lỗi Axios khác được giữ nguyên để caller xử lý.
 */
export const httpClient = axios.create({
  baseURL: '/api/proxy',
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(createApiError(error));
  },
);
