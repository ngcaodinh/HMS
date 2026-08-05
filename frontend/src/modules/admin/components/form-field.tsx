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

/** Trả class input đồng bộ với trang KTV IT, tự thêm trạng thái lỗi khi field có lỗi validate. */
export const getFormFieldInputClassName = (hasError: boolean) =>
  hasError ? `${baseInputClassName} ${errorInputClassName}` : baseInputClassName;

/**
 * Ô nhập có nhãn và lỗi inline, đồng bộ chính xác phong cách form thêm nhân viên của trang KTV IT
 * (label bán đậm không viết hoa, dấu * đỏ, lỗi cỡ 10px đậm màu đỏ).
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
