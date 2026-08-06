import type { AdminIconName } from '../../components/AdminIcon';

/** Màn hình nội bộ của workspace; chuyển tab bằng state, không tạo route con. */
export type AdminScreen = 'overview' | 'staff' | 'catalog' | 'billing' | 'audit';

/** Một mục điều hướng với icon và nhãn hiển thị tương ứng với `AdminScreen`. */
export type AdminNavItem = {
  icon: AdminIconName;
  id: AdminScreen;
  label: string;
};

/** Nhóm mục điều hướng hiển thị trên sidebar quản trị. */
export type AdminNavSection = {
  items: AdminNavItem[];
  title: string;
};

/** Cấu hình sidebar theo nhóm nghiệp vụ; không phải danh sách quyền backend. */
export const adminNavSections: AdminNavSection[] = [
  {
    items: [{ icon: 'home', id: 'overview', label: 'Tổng quan' }],
    title: 'Điều hành',
  },
  {
    items: [
      { icon: 'users', id: 'staff', label: 'Nhân sự & Phân quyền' },
      { icon: 'package', id: 'catalog', label: 'Khoa phòng & Danh mục dịch vụ' },
    ],
    title: 'Quản trị',
  },
  {
    items: [
      { icon: 'receipt', id: 'billing', label: 'Doanh thu & Giường bệnh' },
      { icon: 'shield', id: 'audit', label: 'Nhật ký kiểm toán' },
    ],
    title: 'Vận hành',
  },
];

/** Tiêu đề/phụ đề của từng màn hình, không chứa dữ liệu động từ API. */
export const adminScreenMeta: Record<AdminScreen, { subtitle: string; title: string }> = {
  audit: {
    subtitle: 'Theo dõi thao tác quản trị và truy cập hệ thống (demo, chỉ đọc)',
    title: 'Nhật ký kiểm toán',
  },
  billing: {
    subtitle: 'Doanh thu theo phương thức thanh toán và quản lý giường bệnh theo khoa',
    title: 'Doanh thu & Giường bệnh',
  },
  catalog: {
    subtitle: 'Quản lý danh mục dịch vụ, giá và mức trần bảo hiểm y tế',
    title: 'Khoa phòng & Danh mục dịch vụ',
  },
  overview: {
    subtitle: 'Tổng quan hoạt động bệnh viện theo thời gian thực (dữ liệu demo)',
    title: 'Tổng quan quản trị',
  },
  staff: {
    subtitle: 'Quản lý tài khoản nhân viên và vai trò truy cập hệ thống',
    title: 'Nhân sự & Phân quyền',
  },
};
