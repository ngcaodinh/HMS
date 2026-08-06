/** Danh sách message theo tên field, dùng để hiển thị lỗi validation tại đúng control. */
export type FieldErrors = Record<string, string[]>;

/**
 * Lỗi API đã chuẩn hóa để component không phụ thuộc trực tiếp vào response wire.
 * @remarks `status` là HTTP status hoặc `0` khi không có response HTTP; `code` là mã nghiệp vụ;
 * `fields` và thời gian retry có thể vắng mặt tùy loại lỗi. Lỗi này được ném bởi các
 * boundary/API adapter dùng `fetch`.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly fields?: FieldErrors;
  readonly retryAfterSeconds?: number;
  readonly status: number;

  constructor({
    code,
    fields,
    message,
    retryAfterSeconds,
    status,
  }: {
    code: string;
    fields?: FieldErrors;
    message: string;
    retryAfterSeconds?: number;
    status: number;
  }) {
    super(message);
    this.code = code;
    this.fields = fields;
    this.retryAfterSeconds = retryAfterSeconds;
    this.status = status;
  }

  get hasFieldErrors() {
    return Boolean(this.fields && Object.keys(this.fields).length > 0);
  }
}
