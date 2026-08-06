import type { ReactNode } from 'react';

import type { RoleCode } from '@/shared/auth/role-routing';

type RoleIconProps = {
  role: RoleCode;
  className?: string;
};

// Khối đầu và vai dùng chung; từng role chỉ thay đổi phụ kiện đặc trưng trên ngực hoặc cổ.
const PERSON_SILHOUETTE = (
  <>
    <circle cx="12" cy="7" r="3" />
    <path d="M6 21v-2.5c0-3.3 2.7-6 6-6s6 2.7 6 6V21a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1Z" />
  </>
);

// Ánh xạ đầy đủ các RoleCode sang phụ kiện SVG; icon chỉ mang tính trang trí, không là role gate.
const ROLE_ICON_PATHS: Record<RoleCode, ReactNode> = {
  // Bác sĩ - người + ống nghe quàng cổ
  doctor: (
    <>
      {PERSON_SILHOUETTE}
      <circle cx="12" cy="16.3" fill="none" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="16.3" r="0.7" />
    </>
  ),
  // Điều dưỡng - người + huy hiệu chữ thập y tế trên ngực
  nurse: (
    <>
      {PERSON_SILHOUETTE}
      <rect height="5" rx="0.4" width="2.2" x="10.9" y="14.5" />
      <rect height="2.2" rx="0.4" width="5.2" x="9.4" y="16" />
    </>
  ),
  // Dược sĩ - người + huy hiệu viên thuốc trên ngực
  pharmacist: (
    <>
      {PERSON_SILHOUETTE}
      <rect height="2.6" rx="1.3" transform="rotate(-30 12 16)" width="5.4" x="9.3" y="14.7" />
      <rect
        fillOpacity="0.45"
        height="2.6"
        rx="0.5"
        transform="rotate(-30 12 16)"
        width="1.4"
        x="11.3"
        y="14.7"
      />
    </>
  ),
  // KTV xét nghiệm - người + huy hiệu bình tam giác trên ngực
  lab_tech: (
    <>
      {PERSON_SILHOUETTE}
      <path d="M11 14.2h2v1.3l1.6 3a1 1 0 0 1-.9 1.5h-3.4a1 1 0 0 1-.9-1.5l1.6-3Z" />
    </>
  ),
  // Lễ tân - người + tai nghe tổng đài
  receptionist: (
    <>
      {PERSON_SILHOUETTE}
      <path d="M8.3 6.7a3.9 3.9 0 0 1 7.4 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.3" cy="7.6" r="1.1" />
      <circle cx="15.7" cy="7.6" r="1.1" />
    </>
  ),
  // Kế toán - người + cà vạt
  accountant: (
    <>
      {PERSON_SILHOUETTE}
      <path d="M11.2 10.3h1.6l0.6 2.2-1.4 1.6-1.4-1.6Z" />
    </>
  ),
  // Quản trị / KTV IT - người + huy hiệu cờ lê trên ngực
  admin: (
    <>
      {PERSON_SILHOUETTE}
      <rect height="4.6" rx="0.8" transform="rotate(45 12 16.5)" width="1.6" x="11.2" y="14.2" />
      <circle cx="10.3" cy="14.6" fill="none" r="1.3" stroke="currentColor" strokeWidth="1.3" />
    </>
  ),
  // Kỹ thuật IT dùng cùng biểu tượng công cụ với vai trò quản trị.
  it_tech: (
    <>
      {PERSON_SILHOUETTE}
      <rect height="4.6" rx="0.8" transform="rotate(45 12 16.5)" width="1.6" x="11.2" y="14.2" />
      <circle cx="10.3" cy="14.6" fill="none" r="1.3" stroke="currentColor" strokeWidth="1.3" />
    </>
  ),
  // Giám đốc - người + huy hiệu cặp công tác trên ngực
  director: (
    <>
      {PERSON_SILHOUETTE}
      <rect height="3.2" rx="0.5" width="4.6" x="9.7" y="14.6" />
      <path
        d="M11 14.6v-.8a1 1 0 0 1 1-1 1 1 0 0 1 1 1v.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </>
  ),
};

/**
 * Hiển thị icon SVG đại diện cho role người dùng trong avatar của sidebar.
 *
 * @param role Mã role dùng để chọn phụ kiện tương ứng trong `ROLE_ICON_PATHS`.
 * @param className Class Tailwind cho kích thước/màu; mặc định kế thừa `currentColor`.
 * @returns SVG trang trí với `aria-hidden`; không thay thế guard quyền ở UI hoặc backend.
 */
export function RoleIcon({ role, className = 'h-5 w-5' }: RoleIconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
      {ROLE_ICON_PATHS[role]}
    </svg>
  );
}
