/** Các lane nghiệp vụ được hiển thị trong workspace điều dưỡng. */
export type NurseScreen = 'vitals' | 'samples' | 'beds' | 'orders' | 'emergency';

/** Tên icon hợp lệ do component icon của workspace hỗ trợ. */
export type IconName =
  | 'activity'
  | 'alert'
  | 'bed'
  | 'calendar'
  | 'check'
  | 'clipboard'
  | 'file'
  | 'flask'
  | 'heart'
  | 'logOut'
  | 'refresh'
  | 'search'
  | 'shield'
  | 'syringe'
  | 'user';

/** Hợp đồng dữ liệu của một mục điều hướng lane điều dưỡng. */
export type NavItem = {
  icon: IconName;
  id: NurseScreen;
  label: string;
};

/** Dữ liệu hiển thị một thẻ thống kê; `delta` đã được format thành chuỗi nếu có. */
export type StatCard = {
  delta?: string;
  icon: IconName;
  iconClass: string;
  label: string;
  value: string;
  valueClass?: string;
};

/**
 * Ánh xạ mã loại y lệnh từ backend sang nhãn tiếng Việt dùng trong bộ lọc UI.
 * Mã chưa khai báo không có fallback trong map này và không làm thay đổi status server.
 */
export const orderTypeLabels: Record<string, string> = {
  medication: 'Thuốc',
  monitoring: 'Theo dõi',
  care: 'Chăm sóc',
  diet: 'Dinh dưỡng',
  procedure: 'Thủ thuật',
};

/** Thứ tự và nhãn các lane; việc hiển thị lane không thay thế authorization ở backend. */
export const navItems: NavItem[] = [
  { id: 'vitals', label: 'Tiếp nhận & Sinh hiệu', icon: 'heart' },
  { id: 'samples', label: 'Lấy mẫu & Bàn giao mẫu', icon: 'flask' },
  { id: 'beds', label: 'Quản lý buồng giường', icon: 'bed' },
  { id: 'orders', label: 'Y lệnh & Chăm sóc', icon: 'clipboard' },
  { id: 'emergency', label: 'Chuẩn hóa cấp cứu', icon: 'shield' },
];

// Giữ khai báo type multiline để metadata dễ mở rộng.
// prettier-ignore
export const screenMeta: Record<
  NurseScreen,
  { title: string; titleClass?: string }
> = {
  vitals: {
    title: 'Tiếp nhận & Đo chỉ số sinh hiệu',
  },
  samples: {
    title: 'Quản lý lấy mẫu & Bàn giao mẫu bệnh phẩm',
  },
  beds: {
    title: 'Sơ đồ buồng bệnh & Giường bệnh',
  },
  orders: {
    title: 'Danh sách y lệnh & Kế hoạch chăm sóc',
  },
  emergency: {
    title: 'Chuẩn hóa danh tính bệnh nhân cấp cứu vô danh',
    titleClass: 'text-[#ba1a1a]',
  },
};
