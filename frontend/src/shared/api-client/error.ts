export type FieldErrors = Record<string, string[]>;

/**
 * Lỗi API đã được chuẩn hóa để component không phụ thuộc trực tiếp response wire.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly fields?: FieldErrors;
  readonly status: number;

  constructor({
    code,
    fields,
    message,
    status,
  }: {
    code: string;
    fields?: FieldErrors;
    message: string;
    status: number;
  }) {
    super(message);
    this.code = code;
    this.fields = fields;
    this.status = status;
  }

  get hasFieldErrors() {
    return Boolean(this.fields && Object.keys(this.fields).length > 0);
  }
}
