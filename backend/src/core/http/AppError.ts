export type ErrorDetail = {
  field?: string;
  rule: string;
};

/**
 * Lỗi nghiệp vụ có mã lỗi ổn định để controller trả response nhất quán.
 */
export class AppError extends Error {
  readonly code: string;
  readonly details?: ErrorDetail[];
  readonly status: number;

  constructor({
    code,
    details,
    message,
    status,
  }: {
    code: string;
    details?: ErrorDetail[];
    message: string;
    status: number;
  }) {
    super(message);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

/**
 * Type guard giúp tách lỗi nghiệp vụ khỏi lỗi hệ thống không dự đoán trước.
 */
export const isAppError = (error: unknown): error is AppError => error instanceof AppError;
