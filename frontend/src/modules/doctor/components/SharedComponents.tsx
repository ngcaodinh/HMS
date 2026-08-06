import Image from 'next/image';

/** Thư mục asset tĩnh của workspace bác sĩ; tên file được truyền từ component gọi. */
const assetPath = '/doctor-assets';

/**
 * Ghép các class CSS truthy thành một chuỗi.
 * @param classes Danh sách class, trong đó `false`/`undefined` được bỏ qua.
 * @returns Chuỗi class cách nhau bởi một dấu cách.
 */
export function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Render icon asset tĩnh của workspace bác sĩ.
 * @param className Class kích thước/màu tùy chọn, mặc định `h-4 w-4`.
 * @param name Tên file trong thư mục `/doctor-assets`.
 * @returns Ảnh decorative với alt rỗng để không lặp nội dung đã có trong UI.
 * @remarks Hàm không có fallback tải ảnh hoặc xử lý lỗi asset; tên file phải do caller kiểm soát.
 */
export function AssetIcon({ className = 'h-4 w-4', name }: { className?: string; name: string }) {
  return <Image alt="" className={className} height={24} src={`${assetPath}/${name}`} unoptimized width={24} />;
}

/**
 * Tính tuổi theo ngày hiện tại của trình duyệt.
 * @param dateOfBirth Chuỗi ngày sinh hợp lệ, thường ở dạng date-only ISO từ medical record.
 * @returns Tuổi nguyên sau khi xét người đó đã qua sinh nhật trong năm hiện tại hay chưa.
 * @remarks Hàm không validate hoặc chuẩn hóa ngày đầu vào; định dạng không hợp lệ có thể cho kết quả
 *   không hữu ích và cần được kiểm soát ở boundary dữ liệu.
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

/**
 * Định dạng ngày theo locale `vi-VN`.
 * @param dateOfBirth Chuỗi ngày được JavaScript `Date` parse.
 * @returns Ngày hiển thị theo locale trình duyệt; không có fallback cho giá trị không hợp lệ.
 */
export function formatDateVN(dateOfBirth: string): string {
  return new Date(dateOfBirth).toLocaleDateString('vi-VN');
}

/**
 * Định dạng ngày giờ theo locale `vi-VN`.
 * @param value Chuỗi ngày giờ được JavaScript `Date` parse.
 * @returns Ngày giờ theo timezone môi trường trình duyệt.
 */
export function formatDateTimeVN(value: string): string {
  return new Date(value).toLocaleString('vi-VN');
}

/** Chuyển giới tính wire `male`/`female` thành nhãn tiếng Việt dùng trong hồ sơ. */
export function genderLabel(gender: 'male' | 'female'): string {
  return gender === 'male' ? 'Nam' : 'Nữ';
}

/**
 * Nhãn tiếng Việt cho các `resultTableKey` do backend trả về.
 * @remarks Map không tự fallback cho khóa lạ; caller phải chọn nhãn thay thế khi API bổ sung loại
 *   xét nghiệm mới để tránh hiển thị `undefined`.
 */
export const RESULT_TABLE_LABELS: Record<string, string> = {
  xn_hoa_sinh_mau: 'Hoá sinh máu',
  xn_vi_sinh: 'Vi sinh',
  xn_mo_benh_hoc: 'Giải phẫu bệnh',
  xn_nuoc_tieu: 'Nước tiểu / Phân',
  xn_cong_thuc_mau: 'Công thức máu (CBC)',
};
