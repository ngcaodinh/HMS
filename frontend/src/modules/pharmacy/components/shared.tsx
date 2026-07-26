import Image from 'next/image';

/** Reuses the shared icon set under /public/doctor-assets — generic UI icons, not doctor-specific. */
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

export function genderLabel(gender: 'male' | 'female'): string {
  return gender === 'male' ? 'Nam' : 'Nữ';
}

export function formatDateTimeVN(value: string): string {
  return new Date(value).toLocaleString('vi-VN');
}
