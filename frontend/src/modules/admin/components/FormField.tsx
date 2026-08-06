import type { ReactNode } from 'react';

type FormFieldProps = {
  children: ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
  required?: boolean;
};

const baseInputClassName =
  'w-full rounded-lg border border-[#bfc7d2] px-3 py-2 text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15';
const errorInputClassName = 'border-[#ba1a1a]/40 bg-[#ffdad6]/25';

export const formInputClassName = baseInputClassName;
export const formSelectClassName = baseInputClassName;

/**
 * Trả class input đồng bộ với giao diện Admin, tự thêm trạng thái lỗi khi field có lỗi validate.
 * @param hasError - Cho biết field có message lỗi để đổi viền/nền cảnh báo.
 * @returns Chuỗi class cơ sở, có thêm class cảnh báo khi `hasError` là `true`.
 */
export const getFormFieldInputClassName = (hasError: boolean) =>
  hasError ? `${baseInputClassName} ${errorInputClassName}` : baseInputClassName;

/**
 * Ô nhập có nhãn, dấu bắt buộc tùy chọn và lỗi inline.
 * @param children - Control input/select đã liên kết với `htmlFor`.
 * @param error - Message lỗi đầu tiên cần hiển thị; bỏ qua khi không có lỗi.
 * @param htmlFor - ID của control để hỗ trợ liên kết label/accessibility.
 * @param label - Nhãn nghiệp vụ của field.
 * @param required - Hiển thị dấu bắt buộc, không tự thực hiện validation.
 */
export function FormField({ children, error, htmlFor, label, required }: FormFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[#3f4851]" htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-[#ba1a1a]"> *</span> : null}
      </label>
      {children}
      {error ? <p className="mt-1 text-[10px] font-semibold text-[#ba1a1a]">{error}</p> : null}
    </div>
  );
}
