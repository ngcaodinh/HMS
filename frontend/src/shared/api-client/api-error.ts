/** Đại diện cho một lỗi theo field trong envelope `{ error: { code, message, details } }`. */
export interface ApiErrorDetail {
  field: string;
  rule: string;
}

/** Lỗi HTTP giữ lại mã nghiệp vụ, status và chi tiết để layer gọi xử lý theo contract. */
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
