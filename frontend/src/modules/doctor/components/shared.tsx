import Image from 'next/image';

const assetPath = '/doctor-assets';

export function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function AssetIcon({ className = 'h-4 w-4', name }: { className?: string; name: string }) {
  return <Image alt="" className={className} height={24} src={`${assetPath}/${name}`} unoptimized width={24} />;
}

export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export function formatDateVN(dateOfBirth: string | null): string {
  if (!dateOfBirth) return '—';
  return new Date(dateOfBirth).toLocaleDateString('vi-VN');
}

export function formatDateTimeVN(value: string): string {
  return new Date(value).toLocaleString('vi-VN');
}

export function genderLabel(gender: 'male' | 'female'): string {
  return gender === 'male' ? 'Nam' : 'Nữ';
}

export const RESULT_TABLE_LABELS: Record<string, string> = {
  xn_hoa_sinh_mau: 'Hoá sinh máu',
  xn_vi_sinh: 'Vi sinh',
  xn_mo_benh_hoc: 'Giải phẫu bệnh',
  xn_nuoc_tieu: 'Nước tiểu / Phân',
  xn_cong_thuc_mau: 'Công thức máu (CBC)',
};
