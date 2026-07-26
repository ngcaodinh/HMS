/**
 * Lỗi nghiệp vụ chuẩn Service Lane v1 (error.code).
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: Array<{ field: string; rule: string }>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Array<{ field: string; rule: string }>,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
