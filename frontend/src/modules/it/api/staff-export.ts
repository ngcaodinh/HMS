import type { StaffUser } from '../types/staff.schema';

const spreadsheetFormulaPattern = /^[\s]*[=+\-@]/u;

/**
 * Escape cú pháp CSV và vô hiệu hóa công thức spreadsheet trong dữ liệu do người dùng kiểm soát.
 * Prefix dấu nháy đơn để Excel/Google Sheets đọc ô là text thay vì thực thi công thức.
 *
 * @param value Một ô dạng text lấy từ dữ liệu staff đã parse.
 * @returns Ô CSV đã quote và escape dấu nháy kép.
 */
const escapeCsvCell = (value: string) => {
  const safeValue = spreadsheetFormulaPattern.test(value) ? `'${value}` : value;

  return `"${safeValue.replaceAll('"', '""')}"`;
};

/**
 * Tạo CSV cục bộ từ danh sách staff đã parse để operator tải xuống.
 *
 * @param users Danh sách hiện đang hiển thị theo filter/trang hiện tại.
 * @param departmentLabelById Bản đồ code khoa/phòng sang nhãn tiếng Việt.
 * @param roleLabelByCode Bản đồ role code sang nhãn hiển thị.
 * @returns Nội dung CSV có BOM UTF-8, thời điểm đăng nhập dùng locale `vi-VN`.
 * @remarks Báo cáo chỉ chứa field phục vụ vận hành; không xuất password, CCCD hoặc credential.
 * Giá trị bắt đầu bằng ký tự công thức spreadsheet được prefix để giảm rủi ro khi mở file.
 */
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
