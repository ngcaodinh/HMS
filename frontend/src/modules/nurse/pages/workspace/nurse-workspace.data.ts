export type NurseScreen = 'vitals' | 'samples' | 'beds' | 'orders' | 'emergency';
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

export type NavItem = {
  icon: IconName;
  id: NurseScreen;
  label: string;
};

export type StatCard = {
  delta?: string;
  icon: IconName;
  iconClass: string;
  label: string;
  value: string;
  valueClass?: string;
};

export const orderTypeLabels: Record<string, string> = {
  medication: 'Thuốc',
  monitoring: 'Theo dõi',
  care: 'Chăm sóc',
  diet: 'Dinh dưỡng',
  procedure: 'Thủ thuật',
};

export const navItems: NavItem[] = [
  { id: 'vitals', label: 'Tiếp nhận & Sinh hiệu', icon: 'heart' },
  { id: 'samples', label: 'Lấy mẫu & Bàn giao mẫu', icon: 'flask' },
  { id: 'beds', label: 'Quản lý buồng giường', icon: 'bed' },
  { id: 'orders', label: 'Y lệnh & Chăm sóc', icon: 'clipboard' },
  { id: 'emergency', label: 'Chuẩn hóa cấp cứu', icon: 'shield' },
];

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
