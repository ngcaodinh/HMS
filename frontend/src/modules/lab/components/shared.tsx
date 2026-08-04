import Image from 'next/image';

/** Reuses the shared icon set under /public/doctor-assets — generic UI icons, not doctor-specific. */
const assetPath = '/doctor-assets';

export function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function AssetIcon({ className = 'h-4 w-4', name }: { className?: string; name: string }) {
  return <Image alt="" className={className} height={24} src={`${assetPath}/${name}`} unoptimized width={24} />;
}

export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export function genderLabel(gender: 'male' | 'female'): string {
  return gender === 'male' ? 'Nam' : 'Nữ';
}

export function formatDateTimeVN(value: string): string {
  return new Date(value).toLocaleString('vi-VN');
}

export const RESULT_TABLE_LABELS: Record<string, string> = {
  xn_hoa_sinh_mau: 'Hoá sinh máu',
  xn_vi_sinh: 'Vi sinh',
  xn_mo_benh_hoc: 'Giải phẫu bệnh',
  xn_nuoc_tieu: 'Nước tiểu / Phân',
  xn_cong_thuc_mau: 'Công thức máu (CBC)',
};

/** Thứ tự tab hiển thị trong màn Nhập kết quả, khớp đúng ảnh mẫu (Hoá sinh máu mặc định trước) —
 * thêm "Công thức máu" ở cuối vì đây là loại thứ 5 có thật trong hệ thống, không xuất hiện trong
 * ảnh mẫu gốc (ảnh chỉ có 4 tab). */
export const RESULT_TABLE_TAB_ORDER: Array<'xn_hoa_sinh_mau' | 'xn_vi_sinh' | 'xn_mo_benh_hoc' | 'xn_nuoc_tieu' | 'xn_cong_thuc_mau'> = [
  'xn_hoa_sinh_mau',
  'xn_vi_sinh',
  'xn_mo_benh_hoc',
  'xn_nuoc_tieu',
  'xn_cong_thuc_mau',
];

const inputClass =
  'h-10 w-full rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-3 text-[13px] text-[#171c1f] outline-none transition-colors duration-150 focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10';
const selectClass = inputClass + ' pr-2';
const labelClass = 'mb-1.5 block text-xs font-semibold text-[#3f4851]';
const hintClass = 'mt-1 text-[11px] text-[#8a8f96]';

export function NumericField({
  error,
  hint,
  label,
  onBlur,
  onChange,
  unit,
  value,
}: {
  error?: string;
  hint?: string;
  label: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  unit?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {unit ? ` (${unit})` : ''}
      </span>
      <input
        aria-describedby={error ? `${label}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={inputClass}
        inputMode="decimal"
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        type="text"
        value={value}
      />
      {hint && <p className={hintClass}>{hint}</p>}
      {error && <p className="mt-1 text-[11px] font-medium leading-4 text-[#ba1a1a]" id={`${label}-error`} role="alert">{error}</p>}
    </label>
  );
}

export function TextField({
  error,
  label,
  onBlur,
  onChange,
  value,
}: {
  error?: string;
  label: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        aria-describedby={error ? `${label}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={inputClass}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        type="text"
        value={value}
      />
      {error && <p className="mt-1 text-[11px] font-medium leading-4 text-[#ba1a1a]" id={`${label}-error`} role="alert">{error}</p>}
    </label>
  );
}

export function SelectField({
  emptyLabel = '— Chưa chọn —',
  error,
  label,
  onBlur,
  onChange,
  options,
  value,
}: {
  emptyLabel?: string;
  error?: string;
  label: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select
        aria-describedby={error ? `${label}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={selectClass}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-[11px] font-medium leading-4 text-[#ba1a1a]" id={`${label}-error`} role="alert">{error}</p>}
    </label>
  );
}

export function TextAreaField({
  error,
  label,
  onBlur,
  onChange,
  value,
}: {
  error?: string;
  label: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <textarea
        aria-describedby={error ? `${label}-error` : undefined}
        aria-invalid={Boolean(error)}
        className="min-h-20 w-full resize-none rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-3 py-2 text-[13px] leading-6 text-[#171c1f] outline-none transition-colors duration-150 focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10"
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      {error && <p className="mt-1 text-[11px] font-medium leading-4 text-[#ba1a1a]" id={`${label}-error`} role="alert">{error}</p>}
    </label>
  );
}
