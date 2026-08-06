import { AppError } from '../errors/app-error';
import type { ErrorDetail } from '../errors/app-error';

export type FieldErrors = Record<string, string[]>;

/**
 * Gom chi tiết lỗi theo field để frontend gắn thông báo vào đúng input.
 * Những lỗi không gắn field cụ thể được bỏ qua khỏi map fields nhưng vẫn giữ trong details.
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

/** Kiểm tra lỗi có phải lỗi nghiệp vụ đã được chuẩn hóa hay không. */
export const isAppError = (error: unknown): error is AppError => error instanceof AppError;

export { AppError };
export type { ErrorDetail };
