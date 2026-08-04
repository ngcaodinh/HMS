import type { StaffUser } from '../types/staff.schema';

const escapeCsvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;

/** Tạo CSV từ danh sách đã parse, không đưa password hoặc CCCD vào file báo cáo. */
export const buildStaffUsersCsv = (
  users: StaffUser[],
  departmentLabelById: Readonly<Record<string, string>>,
  roleLabelByCode: Readonly<Record<string, string>>,
) => {
  const header = [
    'Mã tài khoản',
    'Username',
    'Họ và tên',
    'Vai trò',
    'Khoa / Phòng',
    'Số điện thoại',
    'Đăng nhập cuối',
    'Trạng thái',
  ];
  const rows = users.map((user) => [
    user.id,
    user.username,
    user.fullName,
    roleLabelByCode[user.roleCodes[0]] ?? user.roleCodes[0],
    departmentLabelById[user.departmentId] ?? user.departmentId,
    user.phoneNumber,
    user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập',
    user.isActive ? 'Hoạt động' : 'Bị khóa',
  ]);

  return `\ufeff${[header, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}`;
};
