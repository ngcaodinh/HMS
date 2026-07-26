import axios from 'axios';

import { ApiError, type FieldErrors } from './error';

type ApiErrorDetail = {
  field?: string;
  message?: string;
};

type EnvelopeError = {
  code?: string;
  details?: ApiErrorDetail[];
  fields?: FieldErrors;
  message?: string;
};

const normalizeDetailFields = (details: unknown): FieldErrors | undefined => {
  if (!Array.isArray(details)) return undefined;

  const fields = details.reduce<FieldErrors>((currentFields, detail) => {
    if (typeof detail !== 'object' || detail === null || !('field' in detail)) {
      return currentFields;
    }

    const field = detail.field;
    if (typeof field !== 'string') return currentFields;

    const message = 'message' in detail && typeof detail.message === 'string'
      ? detail.message
      : 'Dữ liệu không hợp lệ';

    return {
      ...currentFields,
      [field]: [...(currentFields[field] ?? []), message],
    };
  }, {});

  return Object.keys(fields).length > 0 ? fields : undefined;
};

// Chuyen loi envelope cua Axios ve cung ApiError ma UI dang bat bang instanceof.
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
 * Same-origin axios instance pointed at the Next.js BFF proxy (`app/api/proxy/[...path]`),
 * which attaches the JWT from the httpOnly session cookie. Never call the backend origin
 * directly from client code.
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
