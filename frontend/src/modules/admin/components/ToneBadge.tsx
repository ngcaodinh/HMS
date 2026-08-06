import type { Tone } from '../types/admin.types';

type ToneBadgeProps = {
  label: string;
  tone: Tone;
};

const toneClassByTone: Record<Tone, string> = {
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  slate: 'bg-slate-100 text-slate-700',
  sky: 'bg-sky-100 text-sky-800',
  teal: 'bg-teal-100 text-teal-800',
};

/**
 * Nhãn trạng thái dạng pill dùng chung cho các bảng trong module Admin.
 * @param label - Nội dung trạng thái đã được component cha chọn theo nghiệp vụ.
 * @param tone - Màu semantic để trình bày, không phải quyền hoặc trạng thái backend.
 */
export function ToneBadge({ label, tone }: ToneBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-4 ${toneClassByTone[tone]}`}
    >
      {label}
    </span>
  );
}
