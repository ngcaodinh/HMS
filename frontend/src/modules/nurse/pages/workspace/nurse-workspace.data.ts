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
  badge?: string;
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

export type QueuePatient = {
  id: string;
  meta: string;
  name: string;
  number: string;
  status: 'calling' | 'waiting';
};

export type VitalField = {
  label: string;
  unit?: string;
  value: string;
};

export type BedStatus = 'occupied' | 'empty' | 'emergency' | 'discharge';

export type Bed = {
  allergy?: boolean;
  bed: string;
  diagnosis?: string;
  meta?: string;
  patient?: string;
  status: BedStatus;
};

export type SampleOrder = {
  code: string;
  name: string;
  order: string;
  status: 'pending' | 'done';
  time?: string;
  type: string;
};

export type CareOrder = {
  instruction: string;
  note: string;
  patient: string;
  room: string;
  status: 'pending' | 'done' | 'blocked' | 'delayed';
  time: string;
  title: string;
  tone?: 'danger' | 'purple' | 'blue' | 'green';
};

export const navItems: NavItem[] = [
  { id: 'vitals', label: 'Tiếp nhận & Sinh hiệu', badge: '7', icon: 'heart' },
  { id: 'samples', label: 'Lấy mẫu & Bàn giao', badge: '4', icon: 'flask' },
  { id: 'beds', label: 'Quản lý buồng giường', icon: 'bed' },
  { id: 'orders', label: 'Y lệnh & Chăm sóc', badge: '3', icon: 'clipboard' },
  { id: 'emergency', label: 'Chuẩn hóa cấp cứu', badge: '2', icon: 'shield' },
];

export const screenMeta: Record<
  NurseScreen,
  { subtitle: string; title: string; titleClass?: string }
> = {
  vitals: {
    title: 'Tiếp nhận & Đo chỉ số sinh hiệu',
    subtitle: 'Khoa Da Liễu • Phòng Sàng Lọc A01 • 17/07/2026',
  },
  samples: {
    title: 'Quản lý lấy mẫu & Bàn giao mẫu bệnh phẩm',
    subtitle: 'Phòng lấy mẫu xét nghiệm • 17/07/2026',
  },
  beds: {
    title: 'Sơ đồ buồng bệnh & Giường bệnh',
    subtitle: 'Khoa Da Liễu • Toàn bộ buồng nội trú • Thời gian thực',
  },
  orders: {
    title: 'Danh sách y lệnh & Kế hoạch chăm sóc',
    subtitle: 'Khoa Da Liễu • Ca sáng 6h00 - 14h00 • 17/07/2026',
  },
  emergency: {
    title: 'Chuẩn hóa danh tính bệnh nhân cấp cứu vô danh',
    subtitle: 'Khoa Cấp cứu • Khoa Da Liễu • Khẩn cấp • 17/07/2026',
    titleClass: 'text-[#b91c1c]',
  },
};

export const vitalStats: StatCard[] = [
  {
    value: '24',
    label: 'Tổng ca đã đo hôm nay',
    delta: '↑ 3 so với hôm qua',
    icon: 'calendar',
    iconClass: 'bg-blue-50 text-[#0369a1]',
  },
  {
    value: '7',
    label: 'Đang chờ đo sinh hiệu',
    icon: 'activity',
    iconClass: 'bg-orange-50 text-[#ea580c]',
    valueClass: 'text-[#ea580c]',
  },
  {
    value: '2',
    label: 'Ca có cảnh báo dị ứng',
    icon: 'alert',
    iconClass: 'bg-red-50 text-[#b91c1c]',
    valueClass: 'text-[#b91c1c]',
  },
  {
    value: '8.4',
    label: 'Phút trung bình / bệnh nhân',
    icon: 'heart',
    iconClass: 'bg-cyan-50 text-[#0891b2]',
  },
];

export const queuePatients: QueuePatient[] = [
  {
    number: '01',
    name: 'NGUYỄN VĂN A',
    meta: 'Nam, 42t • ID: 2607-0012',
    id: '2607-0012',
    status: 'calling',
  },
  {
    number: '02',
    name: 'TRẦN THỊ B',
    meta: 'Nữ, 29t • ID: 2607-0018',
    id: '2607-0018',
    status: 'waiting',
  },
  {
    number: '03',
    name: 'LÊ VĂN C',
    meta: 'Nam, 65t • ID: 2607-0022',
    id: '2607-0022',
    status: 'waiting',
  },
  {
    number: '04',
    name: 'PHẠM THỊ D',
    meta: 'Nữ, 38t • ID: 2607-0031',
    id: '2607-0031',
    status: 'waiting',
  },
];

export const vitalFields: VitalField[] = [
  { label: 'Mạch (lần/phút)', value: '72', unit: 'bpm' },
  { label: 'Nhiệt độ (°C)', value: '36.5', unit: '°C' },
  { label: 'Huyết áp (mmHg)', value: '120 / 80' },
  { label: 'Nhịp thở (lần/phút)', value: '18', unit: 'lần/ph' },
  { label: 'SPO2 (%)', value: '98', unit: '%' },
  { label: 'Chiều cao (cm)', value: '168', unit: 'cm' },
  { label: 'Cân nặng (kg)', value: '68.5', unit: 'kg' },
];

export const beds: Bed[] = [
  {
    bed: '101-A',
    patient: 'NGUYỄN VĂN A',
    meta: 'Nam, 42t • BA: 2607-0012 • Vào: 2026-07-15',
    diagnosis: 'Viêm da tiếp xúc dị ứng mạn tính – Giai đoạn bùng phát',
    status: 'occupied',
    allergy: true,
  },
  {
    bed: '101-B',
    patient: 'LÊ VĂN C',
    meta: 'Nam, 65t • BA: 2607-0022 • Vào: 2026-07-10',
    diagnosis: 'Vảy nến thể mảng – Điều trị sinh học',
    status: 'occupied',
  },
  { bed: '101-C', status: 'empty' },
  {
    bed: '101-D',
    patient: 'TRẦN THỊ B',
    meta: 'Nữ, 29t • BA: 2607-0018 • Vào: 2026-07-17',
    diagnosis: 'Phản ứng dị ứng nghiêm trọng – Đang theo dõi cấp cứu',
    status: 'emergency',
  },
  {
    bed: '102-A',
    patient: 'PHẠM THỊ D',
    meta: 'Nữ, 38t • BA: 2607-0031 • Vào: 2026-07-12',
    diagnosis: 'Eczema atopic – Ổn định, BS cho xuất viện',
    status: 'discharge',
  },
  { bed: '102-B', status: 'empty' },
];

export const sampleOrders: SampleOrder[] = [
  {
    code: 'DL-2607-001',
    type: 'Máu toàn phần (EDTA)',
    order: 'Chỉ định: Công thức máu',
    name: 'NGUYỄN VĂN A',
    status: 'pending',
  },
  {
    code: 'DL-2607-002',
    type: 'Sinh thiết da (GAP)',
    order: 'Chỉ định: Mổ sinh thiết chẩn đoán',
    name: 'NGUYỄN VĂN A',
    status: 'done',
    time: '08:15 – 17/07',
  },
];

export const careOrders: CareOrder[] = [
  {
    time: '08:00',
    patient: 'NGUYỄN VĂN A',
    room: '101-A',
    title: 'Ceftriaxon 1g × 1 lọ',
    instruction: 'Liều: 1g IV mỗi 12 giờ',
    note: 'Thử phản ứng da lần đầu tiên trong bệnh án. Bắt buộc xác nhận âm tính trước khi tiêm.',
    status: 'pending',
    tone: 'danger',
  },
  {
    time: '09:00',
    patient: 'NGUYỄN VĂN A',
    room: '101-A',
    title: 'Amoxicillin 500mg',
    instruction: 'Liều: 500mg PO mỗi 8 giờ',
    note: 'Thuốc nằm trong danh mục dị ứng của bệnh nhân. Không thực hiện. Liên hệ ngay BS. Trần Văn Khoa.',
    status: 'blocked',
    tone: 'danger',
  },
  {
    time: '07:00',
    patient: 'LÊ VĂN C',
    room: '101-B',
    title: 'Ringer Lactat 500ml × 1 chai',
    instruction: 'Tốc độ: 40 giọt/phút',
    note: 'Theo dõi huyết áp mỗi 30 phút trong khi truyền.',
    status: 'done',
    tone: 'blue',
  },
  {
    time: '08:30',
    patient: 'PHẠM THỊ D',
    room: '102-A',
    title: 'Mometasone Furoate Cream 0.1%',
    instruction: 'Bôi mỏng vùng tổn thương',
    note: 'Thay băng vết thương trước khi bôi thuốc.',
    status: 'delayed',
    tone: 'purple',
  },
];
