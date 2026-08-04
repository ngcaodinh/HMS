'use client';

import type { ApiError, FieldErrors } from '@/shared/api-client';

/**
 * Lấy lỗi đầu tiên của một field từ payload API để form hiển thị đúng nguyên nhân.
 * Không dùng message tổng quát khi backend đã trả lỗi cụ thể theo field.
 */
export function getFieldError(fields: FieldErrors | undefined, field: string): string | undefined {
  return fields?.[field]?.[0];
}

/** Chuyển lỗi field của API về map một chuỗi để component dùng chung với lỗi local. */
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

/** Hiển thị lỗi ngay dưới control và giữ cùng màu cảnh báo của workspace bác sĩ. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <span className="mt-1 block text-[11px] font-medium text-[#ba1a1a]" role="alert">
      {message}
    </span>
  );
}
