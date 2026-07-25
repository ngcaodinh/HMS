export interface ApiErrorDetail {
  field: string;
  rule: string;
}

/** Mirrors the `error` object of the backend's `{ error: { code, message, details } }` envelope. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: ApiErrorDetail[];

  constructor(code: string, message: string, status: number, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
