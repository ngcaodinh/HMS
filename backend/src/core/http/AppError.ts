export type ErrorDetail = {
  field?: string;
  message?: string;
  rule: string;
};

export type FieldErrors = Record<string, string[]>;

/**
 * Gom chi tiết lỗi theo từng field để frontend gắn lỗi vào đúng input.
 * Nhận details đã được lọc an toàn, trả undefined khi lỗi không thuộc field cụ thể.
 */
export const mapErrorDetailsToFields = (details?: ErrorDetail[]): FieldErrors | undefined => {
  const fields = details?.reduce<FieldErrors>((currentFields, detail) => {
    if (!detail.field) return currentFields;

    return {
      ...currentFields,
      [detail.field]: [
        ...(currentFields[detail.field] ?? []),
        detail.message ?? 'Dữ liệu không hợp lệ',
      ],
    };
  }, {});

  return fields && Object.keys(fields).length > 0 ? fields : undefined;
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
