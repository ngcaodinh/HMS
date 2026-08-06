import Image from 'next/image';

/** Đường dẫn bộ icon UI dùng chung trong `/public/doctor-assets`, không gắn với riêng phân hệ
 * bác sĩ. */
const assetPath = '/doctor-assets';

/** Ghép các class CSS đang có giá trị, bỏ qua class rỗng hoặc điều kiện false. */
export function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Hiển thị icon asset dùng chung cho các nút và nhãn của màn Lab.
 *
 * @param className - Kích thước/class bổ sung; mặc định là `h-4 w-4`.
 * @param name - Tên file trong thư mục `/public/doctor-assets`.
 * @remarks Icon được đánh dấu decorative bằng `alt=""`; nội dung có ý nghĩa phải nằm ở text hoặc
 * label của component gọi, không dựa riêng vào ảnh để truyền tải trạng thái hay quyền truy cập.
 */
export function AssetIcon({ className = 'h-4 w-4', name }: { className?: string; name: string }) {
  return <Image alt="" className={className} height={24} src={`${assetPath}/${name}`} unoptimized width={24} />;
}

/**
 * Tính tuổi tròn theo ngày hiện tại của runtime từ chuỗi ngày sinh.
 *
 * @param dateOfBirth - Chuỗi ngày có thể phân tích bởi `Date`, thường là giá trị ngày từ API.
 * @returns Số tuổi nguyên; kết quả chưa tròn sinh nhật trong năm hiện tại được giảm một.
 * @remarks Hàm không tự thay thế ngày không hợp lệ và sử dụng múi giờ cục bộ của runtime khi
 * so sánh.
 */
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

/** Chuyển mã giới tính trong hợp đồng Lab thành nhãn tiếng Việt dùng trên chip bệnh nhân. */
export function genderLabel(gender: 'male' | 'female'): string {
  return gender === 'male' ? 'Nam' : 'Nữ';
}

/**
 * Định dạng thời điểm theo locale `vi-VN` để hiển thị trong giao diện Lab.
 *
 * @param value - Chuỗi thời điểm được `Date` phân tích.
 * @returns Chuỗi ngày giờ theo locale của Việt Nam; múi giờ tuân theo runtime trình duyệt.
 */
export function formatDateTimeVN(value: string): string {
  return new Date(value).toLocaleString('vi-VN');
}

/** Nhãn hiển thị cho từng `ResultTableKey`; nơi gọi phải tự chọn `testName` nếu key không có
 * nhãn. */
export const RESULT_TABLE_LABELS: Record<string, string> = {
  xn_hoa_sinh_mau: 'Hoá sinh máu',
  xn_vi_sinh: 'Vi sinh',
  xn_mo_benh_hoc: 'Giải phẫu bệnh',
  xn_nuoc_tieu: 'Nước tiểu / Phân',
  xn_cong_thuc_mau: 'Công thức máu (CBC)',
};

/** Thứ tự năm loại phiếu trong màn Nhập kết quả; loại đang chọn mới được phép mở form tương ứng. */
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

/**
 * Hiển thị input số dạng chuỗi để giữ nguyên phần thập phân trong lúc nhập kết quả xét nghiệm.
 *
 * @param error - Lỗi validator của field; nếu có sẽ hiển thị inline và đặt `aria-invalid`.
 * @param hint - Giới hạn/ghi chú đơn vị do form domain cung cấp.
 * @param label - Tên chỉ số hiển thị và dùng làm định danh lỗi.
 * @param onBlur - Callback tùy chọn khi người dùng rời field.
 * @param onChange - Callback nhận chuỗi raw từ input; parent chịu trách nhiệm validate/normalize.
 * @param unit - Đơn vị hiển thị cạnh label, ví dụ `g/L` hoặc `mmol/d`.
 * @param value - Giá trị controlled đã được parent chuẩn hóa về chuỗi.
 * @remarks Component chỉ hiển thị và phát sự kiện, không gọi API, không quản lý loading/success và
 * không quyết định quyền truy cập.
 */
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

/**
 * Hiển thị input văn bản controlled cho metadata hoặc kết quả dạng mô tả.
 *
 * @param error - Lỗi validator cần hiển thị inline, nếu có.
 * @param label - Nhãn field và tiền tố dùng để liên kết thông báo lỗi.
 * @param onBlur - Callback tùy chọn khi rời input.
 * @param onChange - Callback nhận chuỗi người dùng nhập để form domain cập nhật draft.
 * @param value - Giá trị controlled hiện tại.
 */
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

/**
 * Hiển thị select controlled với option rỗng mặc định và lỗi inline.
 *
 * @param emptyLabel - Nhãn fallback khi chưa chọn; mặc định là `— Chưa chọn —`.
 * @param error - Lỗi validator của field, nếu có.
 * @param label - Nhãn hiển thị cho select.
 * @param onBlur - Callback tùy chọn khi rời select.
 * @param onChange - Callback nhận mã option, để form domain cập nhật kết quả.
 * @param options - Danh sách `{ value, label }` theo mã hợp đồng của từng xét nghiệm.
 * @param value - Mã option đang chọn; chuỗi rỗng biểu thị chưa chọn.
 */
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

/**
 * Hiển thị textarea controlled cho ghi chú và mô tả kết quả xét nghiệm.
 *
 * @param error - Lỗi validator cần hiển thị inline, nếu có.
 * @param label - Nhãn textarea.
 * @param onBlur - Callback tùy chọn khi rời textarea.
 * @param onChange - Callback nhận chuỗi người dùng nhập.
 * @param value - Giá trị controlled hiện tại.
 */
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
