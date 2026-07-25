import axios from 'axios';

import { ApiError } from './api-error';

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
    const envelopeError = error?.response?.data?.error;
    if (envelopeError) {
      return Promise.reject(
        new ApiError(envelopeError.code, envelopeError.message, error.response.status, envelopeError.details),
      );
    }
    return Promise.reject(error);
  },
);
