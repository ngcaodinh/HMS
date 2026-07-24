/** Field-level validation detail returned in the `error.details` array of the response envelope. */
export interface ErrorDetail {
  field: string;
  rule: string;
}

/**
 * Thrown by services/controllers instead of formatting a response inline.
 * `error-handler.ts` maps this to the shared error envelope from
 * Tailieu/HMS-Service-Lane-Task-Breakdown.md (§Shared Contract toàn cục v1).
 */
export class AppError extends Error {
  readonly httpStatus: number;
  readonly code: string;
  readonly details?: ErrorDetail[];

  constructor(httpStatus: number, code: string, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = 'AppError';
    this.httpStatus = httpStatus;
    this.code = code;
    this.details = details;
  }

  static badRequest(code: string, message: string, details?: ErrorDetail[]) {
    return new AppError(400, code, message, details);
  }

  static unauthorized(code: string, message: string) {
    return new AppError(401, code, message);
  }

  static forbidden(code: string, message: string) {
    return new AppError(403, code, message);
  }

  static notFound(code: string, message: string) {
    return new AppError(404, code, message);
  }

  static conflict(code: string, message: string) {
    return new AppError(409, code, message);
  }

  static payloadTooLarge(code: string, message: string) {
    return new AppError(413, code, message);
  }

  static unprocessable(code: string, message: string, details?: ErrorDetail[]) {
    return new AppError(422, code, message, details);
  }

  static internal(code: string, message: string) {
    return new AppError(500, code, message);
  }
}
