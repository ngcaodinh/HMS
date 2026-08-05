/**
 * Kiểu dữ liệu dùng chung cho toàn bộ module Admin (bảng điều khiển quản trị bệnh viện demo).
 * Toàn bộ dữ liệu nghiệp vụ ở module này là dữ liệu mock cục bộ, không gọi API thật.
 */

export type Tone = 'green' | 'sky' | 'amber' | 'red' | 'slate' | 'teal';

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

export type DepartmentCode =
  | 'clinical'
  | 'dermatology'
  | 'laboratory'
  | 'pharmacy'
  | 'accounting'
  | 'reception'
  | 'it';

// --- 1) Tổng quan / KPI ---
export type KpiCard = {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: Tone;
};

export type PatientFlowPoint = {
  hour: string;
  value: number;
};

export type DepartmentLoadRow = {
  departmentName: string;
  waiting: number;
  occupied: number;
  completed: number;
  total: number;
  status: 'normal' | 'busy' | 'critical';
  statusLabel: string;
};

export type AdminOverviewSnapshot = {
  kpiCards: KpiCard[];
  hourlyPatientFlow: PatientFlowPoint[];
  departmentLoad: DepartmentLoadRow[];
};

// --- 2) Nhân sự & Phân quyền ---
export type StaffStatus = 'active' | 'locked';

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

export type ServiceCatalogFormValues = {
  code: string;
  name: string;
  departmentCode: '' | DepartmentCode;
  price: string;
  coveredByHealthInsurance: boolean;
  healthInsuranceCeilingPrice: string;
};

// --- 4) Doanh thu & Giường bệnh ---
export type RevenueSnapshot = {
  periodLabel: string;
  cashTotal: number;
  bankTransferTotal: number;
  momoTotal: number;
  insuranceTotal: number;
  writeOffTotal: number;
  netRevenue: number;
};

export type PaymentMethodBreakdownRow = {
  method: 'cash' | 'transfer' | 'momo' | 'insurance';
  label: string;
  amount: number;
  percentOfTotal: number;
};

export type BedOccupancyRow = {
  departmentName: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRatePercent: number;
  status: 'normal' | 'busy' | 'critical';
  statusLabel: string;
};

export type BedStatus = 'available' | 'occupied' | 'maintenance';

export type BedRecord = {
  id: string;
  departmentCode: DepartmentCode;
  roomNumber: string;
  bedNumber: string;
  dailyRate: number;
  status: BedStatus;
};

export type BedFormValues = {
  departmentCode: '' | DepartmentCode;
  roomNumber: string;
  bedNumber: string;
  dailyRate: string;
  status: BedStatus;
};

// --- 5) Nhật ký kiểm toán ---
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

export type AuditSummaryRow = {
  label: string;
  count: number;
};
