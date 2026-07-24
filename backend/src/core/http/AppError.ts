export type ErrorDetail = {
  field?: string;
  rule: string;
};

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

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;
