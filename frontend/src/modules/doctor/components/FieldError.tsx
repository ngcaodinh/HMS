'use client';

import type { ApiError, FieldErrors } from '@/shared/api-client';

/**
 * Lấy lỗi đầu tiên của một field từ payload API để form hiển thị đúng nguyên nhân.
 * @param fields Map lỗi đã chuẩn hóa, mỗi field có thể có nhiều message.
 * @param field Tên field cần lấy lỗi.
 * @returns Message đầu tiên hoặc `undefined` nếu field chưa có lỗi.
 * @remarks Không thay thế lỗi field bằng message tổng quát; validation nghiệp vụ vẫn thuộc backend.
 */
export function getFieldError(fields: FieldErrors | undefined, field: string): string | undefined {
  return fields?.[field]?.[0];
}

/**
 * Chuyển lỗi field của `ApiError` thành map một chuỗi để dùng chung với lỗi local.
 * @param error Lỗi bất kỳ từ mutation/query; lỗi không phải `ApiError` có field sẽ thành map rỗng.
 * @returns Map field → message đầu tiên, dùng fallback khi backend trả mảng message rỗng.
 * @remarks Hàm chỉ đọc lỗi đã được API client chuẩn hóa và không ném lại lỗi mapping.
 */
export function getFieldErrorMap(error: unknown): Record<string, string> {
  if (!(error instanceof Error) || !('fields' in error)) return {};

  const fields = (error as ApiError).fields;
  if (!fields) return {};

  return Object.fromEntries(
    Object.entries(fields).map(([field, messages]) => [
      field,
      messages[0] ?? 'Dữ liệu không hợp lệ',
    ]),
  );
}

/**
 * Hiển thị một lỗi validation ngay dưới control.
 * @param message Message tùy chọn; không có message thì không render node lỗi.
 * @returns Inline alert gắn với control qua ngữ cảnh của caller, hoặc `null` khi không có lỗi.
 * @remarks Component chỉ trình bày lỗi local/server đã được caller chọn, không tự validate hay gọi API.
 */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <span className="mt-1 block text-[11px] font-medium text-[#ba1a1a]" role="alert">
      {message}
    </span>
  );
}
