export type ErrorDetail = {
  field?: string;
  rule: string;
  message?: string;
};

type AppErrorOptions = {
  code: string;
  details?: ErrorDetail[];
  message: string;
  status: number;
};

/**
 * Lỗi nghiệp vụ duy nhất của backend, tương thích cả constructor cũ và constructor dạng options.
 * Các module phải dùng class này để middleware nhận diện đúng và không biến lỗi nghiệp vụ thành 500.
 */
export class AppError extends Error {
  readonly code: string;
  readonly details?: ErrorDetail[];
  readonly status: number;
  readonly statusCode: number;
  readonly httpStatus: number;

  constructor(status: number, code: string, message: string, details?: ErrorDetail[]);
  constructor(options: AppErrorOptions);
  constructor(
    statusOrOptions: number | AppErrorOptions,
    code?: string,
    message?: string,
    details?: ErrorDetail[],
  ) {
    const options =
      typeof statusOrOptions === 'number'
        ? {
            status: statusOrOptions,
            code: code ?? 'INTERNAL_ERROR',
            message: message ?? 'Lỗi hệ thống',
            details,
          }
        : statusOrOptions;

    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.details = options.details;
    this.status = options.status;
    this.statusCode = options.status;
    this.httpStatus = options.status;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, AppError);
  }

  /** Tạo lỗi 400 cho dữ liệu hoặc trạng thái request không hợp lệ. */
  static badRequest(code: string, message: string, details?: ErrorDetail[]) {
    return new AppError(400, code, message, details);
  }

  /** Tạo lỗi 401 khi request chưa xác thực hoặc token không hợp lệ. */
  static unauthorized(code: string, message: string) {
    return new AppError(401, code, message);
  }

  /** Tạo lỗi 403 khi tài khoản không có quyền thực hiện action. */
  static forbidden(code: string, message: string) {
    return new AppError(403, code, message);
  }

  /** Tạo lỗi 404 khi không tìm thấy tài nguyên yêu cầu. */
  static notFound(code: string, message: string) {
    return new AppError(404, code, message);
  }

  /** Tạo lỗi 409 cho xung đột đồng thời hoặc dữ liệu đã tồn tại. */
  static conflict(code: string, message: string, details?: ErrorDetail[]) {
    return new AppError(409, code, message, details);
  }

  /** Tạo lỗi 413 khi request vượt giới hạn kích thước cho phép. */
  static payloadTooLarge(code: string, message: string) {
    return new AppError(413, code, message);
  }

  /** Tạo lỗi 422 khi payload đúng cú pháp nhưng không đạt điều kiện nghiệp vụ. */
  static unprocessable(code: string, message: string, details?: ErrorDetail[]) {
    return new AppError(422, code, message, details);
  }

  /** Tạo lỗi 500 cho lỗi hệ thống đã được chuẩn hóa. */
  static internal(code: string, message: string) {
    return new AppError(500, code, message);
  }
}
