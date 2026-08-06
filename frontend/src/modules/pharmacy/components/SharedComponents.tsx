/**
 * Helper dùng chung cho các màn hình pharmacy.
 * Các hàm chỉ format dữ liệu đã có; không gọi API, không thay đổi state/server state và không quyết định
 * quyền cấp phát hoặc tồn kho.
 */

import Image from 'next/image';

/** Đường dẫn bộ icon dùng chung; tên file được truyền từ component gọi. */
const assetPath = '/doctor-assets';

/** Ghép các class hợp lệ, bỏ qua giá trị false hoặc undefined để giữ className ổn định. */
export function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Hiển thị icon dùng chung từ thư mục public.
 *
 * @param className Class kích thước/vị trí; mặc định là `h-4 w-4`.
 * @param name Tên file icon tương đối trong `/doctor-assets`.
 * @returns Phần tử Image trang trí, không có alt text vì icon không mang nội dung độc lập.
 */
export function AssetIcon({ className = 'h-4 w-4', name }: { className?: string; name: string }) {
  return <Image alt="" className={className} height={24} src={`${assetPath}/${name}`} unoptimized width={24} />;
}

/**
 * Tính tuổi theo ngày sinh và ngày hiện tại của trình duyệt.
 *
 * @param dateOfBirth Chuỗi ngày mà `Date` có thể parse; dùng để hiển thị, không dùng thay xác thực danh tính.
 * @returns Tuổi nguyên theo lịch địa phương của trình duyệt.
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

/** Ánh xạ mã giới tính trong response sang nhãn tiếng Việt để hiển thị. */
export function genderLabel(gender: 'male' | 'female'): string {
  return gender === 'male' ? 'Nam' : 'Nữ';
}

/**
 * Format thời điểm theo locale `vi-VN` của trình duyệt.
 *
 * @param value Chuỗi ngày giờ parse được, thường là ISO 8601 từ API.
 * @returns Chuỗi ngày giờ theo múi giờ và locale của môi trường trình duyệt.
 */
export function formatDateTimeVN(value: string): string {
  return new Date(value).toLocaleString('vi-VN');
}
