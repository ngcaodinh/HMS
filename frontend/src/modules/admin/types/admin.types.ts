/**
 * Kiểu dữ liệu dùng chung cho toàn bộ module Admin (bảng điều khiển quản trị bệnh viện demo).
 * Toàn bộ dữ liệu nghiệp vụ ở module này là dữ liệu mock cục bộ, không gọi API thật.
 */

/** Màu semantic cho KPI và nhãn trạng thái; chỉ phục vụ hiển thị, không phải trạng thái domain. */
export type Tone = 'green' | 'sky' | 'amber' | 'red' | 'slate' | 'teal';

/** Mã vai trò dùng để nối dữ liệu với nhãn hiển thị; không thay thế kiểm tra quyền ở backend. */
export type RoleCode =
  | 'admin'
  | 'receptionist'
  | 'accountant'
  | 'doctor'
  | 'nurse'
  | 'lab_tech'
  | 'pharmacist'
  | 'it_tech'
  | 'director';

/** Mã khoa/phòng dùng để nối dữ liệu với nhãn hiển thị trong module Admin. */
export type DepartmentCode =
  | 'clinical'
  | 'dermatology'
  | 'laboratory'
  | 'pharmacy'
  | 'accounting'
  | 'reception'
  | 'it';

// --- 1) Tổng quan / KPI ---

/** Thẻ KPI đã chuẩn hóa thành chuỗi để hiển thị, không dùng trực tiếp cho tính toán. */
export type KpiCard = {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: Tone;
};

/** Điểm lưu lượng theo giờ; `hour` là nhãn giờ địa phương dạng `HHh`, `value` là số lượt. */
export type PatientFlowPoint = {
  hour: string;
  value: number;
};

/** Số liệu tải của một khoa/phòng; các trường đếm là số nguyên không âm từ snapshot tổng hợp. */
export type DepartmentLoadRow = {
  departmentName: string;
  waiting: number;
  occupied: number;
  completed: number;
  total: number;
  status: 'normal' | 'busy' | 'critical';
  statusLabel: string;
};

/** Snapshot chỉ đọc cho phần tổng quan, được truyền vào từ nguồn dữ liệu của workspace. */
export type AdminOverviewSnapshot = {
  kpiCards: KpiCard[];
  hourlyPatientFlow: PatientFlowPoint[];
  departmentLoad: DepartmentLoadRow[];
};

// --- 2) Nhân sự & Phân quyền ---

/** Trạng thái hiển thị của tài khoản; `locked` không tự động thay thế cơ chế khóa ở backend. */
export type StaffStatus = 'active' | 'locked';

/** Bản ghi nhân sự; các thời điểm dùng chuỗi ISO 8601, còn ngày sinh dùng `YYYY-MM-DD`. */
export type StaffMember = {
  id: string;
  username: string;
  fullName: string;
  roleCode: RoleCode;
  departmentCode: DepartmentCode;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  identityCardNumber: string;
  status: StaffStatus;
  lastLoginAt: string | null;
  createdAt: string;
};

/** Dữ liệu thô của form nhân sự; giá trị rỗng biểu thị lựa chọn chưa hoàn tất. */
export type StaffFormValues = {
  fullName: string;
  username: string;
  phoneNumber: string;
  identityCardNumber: string;
  dateOfBirth: string;
  gender: '' | 'male' | 'female';
  departmentCode: '' | DepartmentCode;
  roleCode: '' | RoleCode;
};

// --- 3) Khoa phòng & Danh mục dịch vụ ---

/** Dịch vụ trong danh mục; giá và mức trần BHYT là số tiền VND, `null` nghĩa là không có trần. */
export type ServiceCatalogItem = {
  id: string;
  code: string;
  name: string;
  departmentCode: DepartmentCode;
  price: number;
  coveredByHealthInsurance: boolean;
  healthInsuranceCeilingPrice: number | null;
  isActive: boolean;
};

/** Dữ liệu thô của form danh mục; các trường tiền giữ dạng chuỗi trước khi schema chuyển đổi. */
export type ServiceCatalogFormValues = {
  code: string;
  name: string;
  departmentCode: '' | DepartmentCode;
  price: string;
  coveredByHealthInsurance: boolean;
  healthInsuranceCeilingPrice: string;
};

// --- 4) Doanh thu & Giường bệnh ---

/** Tổng hợp doanh thu theo kỳ; mọi trường tiền là VND và phần này chỉ dùng để hiển thị. */
export type RevenueSnapshot = {
  periodLabel: string;
  cashTotal: number;
  bankTransferTotal: number;
  momoTotal: number;
  insuranceTotal: number;
  writeOffTotal: number;
  netRevenue: number;
};

/** Phân bổ doanh thu theo phương thức; `percentOfTotal` là phần trăm trong khoảng 0–100. */
export type PaymentMethodBreakdownRow = {
  method: 'cash' | 'transfer' | 'momo' | 'insurance';
  label: string;
  amount: number;
  percentOfTotal: number;
};

/** Công suất giường theo khoa; tỷ lệ là phần trăm đã làm tròn, giường bảo trì vẫn thuộc tổng số. */
export type BedOccupancyRow = {
  departmentName: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRatePercent: number;
  status: 'normal' | 'busy' | 'critical';
  statusLabel: string;
};

/** Trạng thái vận hành của giường; giường bảo trì không được xem là giường trống. */
export type BedStatus = 'available' | 'occupied' | 'maintenance';

/** Bản ghi giường; `dailyRate` là đơn giá VND cho một ngày sử dụng. */
export type BedRecord = {
  id: string;
  departmentCode: DepartmentCode;
  roomNumber: string;
  bedNumber: string;
  dailyRate: number;
  status: BedStatus;
};

/** Dữ liệu thô của form giường; đơn giá giữ dạng chuỗi trước khi schema chuyển thành số VND. */
export type BedFormValues = {
  departmentCode: '' | DepartmentCode;
  roomNumber: string;
  bedNumber: string;
  dailyRate: string;
  status: BedStatus;
};

// --- 5) Nhật ký kiểm toán ---

/** Dòng nhật ký chỉ đọc; `occurredAt` là ISO 8601 và được định dạng theo múi giờ trình duyệt. */
export type AuditLogEntry = {
  id: string;
  occurredAt: string;
  actorUsername: string;
  actorRoleCode: RoleCode | 'system';
  action: string;
  resource: string;
  resourceId?: string;
  description: string;
  tone: Tone;
};

/** Số lượng sự kiện theo nhóm trong phần tóm tắt audit; `count` là số nguyên không âm. */
export type AuditSummaryRow = {
  label: string;
  count: number;
};
