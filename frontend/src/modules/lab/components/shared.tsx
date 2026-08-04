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
  hint,
  label,
  onChange,
  unit,
  value,
}: {
  hint?: string;
  label: string;
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
        className={inputClass}
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        type="text"
        value={value}
      />
      {hint && <p className={hintClass}>{hint}</p>}
    </label>
  );
}

export function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input className={inputClass} onChange={(event) => onChange(event.target.value)} type="text" value={value} />
    </label>
  );
}

export function SelectField({
  emptyLabel = '— Chưa chọn —',
  label,
  onChange,
  options,
  value,
}: {
  emptyLabel?: string;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select className={selectClass} onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextAreaField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <textarea
        className="min-h-20 w-full resize-none rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-3 py-2 text-[13px] leading-6 text-[#171c1f] outline-none transition-colors duration-150 focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
