/**
 * @file admin-mock.data.ts
 * @description Dữ liệu mock cho bảng điều khiển quản trị bệnh viện (/admin). Toàn bộ số liệu và
 * danh sách trong file này chỉ phục vụ demo thao tác, không lấy từ API backend thật. Khi cần dữ
 * liệu thật, thay các hook trong `hooks/` bằng lời gọi API tương ứng mà không cần đổi kiểu dữ liệu.
 */

import type {
  AuditLogEntry,
  BedRecord,
  DepartmentCode,
  DepartmentLoadRow,
  KpiCard,
  PatientFlowPoint,
  PaymentMethodBreakdownRow,
  RevenueSnapshot,
  RoleCode,
  ServiceCatalogItem,
  StaffMember,
} from '../types/admin.types';

export const roleLabelByCode: Record<RoleCode, string> = {
  admin: 'Quản trị viên',
  accountant: 'Kế toán',
  director: 'Giám đốc',
  doctor: 'Bác sĩ',
  it_tech: 'KTV IT',
  lab_tech: 'KTV xét nghiệm',
  nurse: 'Điều dưỡng',
  pharmacist: 'Dược sĩ',
  receptionist: 'Tiếp tân',
};

export const departmentLabelByCode: Record<DepartmentCode, string> = {
  accounting: 'Phòng Kế toán',
  clinical: 'Khoa Khám bệnh',
  dermatology: 'Khoa Da liễu',
  it: 'Phòng Công nghệ thông tin',
  laboratory: 'Khoa Xét nghiệm',
  pharmacy: 'Khoa Dược',
  reception: 'Quầy Tiếp nhận',
};

export const initialKpiCards: KpiCard[] = [
  { helper: 'So với hôm qua +4.2%', id: 'patients', label: 'Bệnh nhân hôm nay', tone: 'sky', value: '286' },
  { helper: 'Đang hoạt động toàn viện', id: 'staff', label: 'Nhân sự đang trực', tone: 'teal', value: '64' },
  { helper: 'Đã trừ giường bảo trì', id: 'beds', label: 'Giường trống', tone: 'green', value: '38 / 120' },
  { helper: 'Đã đối soát BHYT', id: 'revenue', label: 'Doanh thu hôm nay', tone: 'amber', value: '182,4 triệu' },
];

export const initialHourlyPatientFlow: PatientFlowPoint[] = [
  { hour: '07h', value: 12 },
  { hour: '08h', value: 34 },
  { hour: '09h', value: 58 },
  { hour: '10h', value: 71 },
  { hour: '11h', value: 52 },
  { hour: '13h', value: 40 },
  { hour: '14h', value: 63 },
  { hour: '15h', value: 49 },
  { hour: '16h', value: 31 },
];

export const initialDepartmentLoad: DepartmentLoadRow[] = [
  {
    completed: 58,
    departmentName: 'Khoa Khám bệnh',
    occupied: 12,
    status: 'busy',
    statusLabel: 'Đông bệnh nhân',
    total: 70,
    waiting: 12,
  },
  {
    completed: 21,
    departmentName: 'Khoa Da liễu',
    occupied: 4,
    status: 'normal',
    statusLabel: 'Bình thường',
    total: 25,
    waiting: 4,
  },
  {
    completed: 33,
    departmentName: 'Khoa Xét nghiệm',
    occupied: 9,
    status: 'normal',
    statusLabel: 'Bình thường',
    total: 42,
    waiting: 9,
  },
  {
    completed: 5,
    departmentName: 'Khoa Dược',
    occupied: 2,
    status: 'critical',
    statusLabel: 'Thiếu nhân sự',
    total: 7,
    waiting: 2,
  },
];

export const initialStaffMembers: StaffMember[] = [
  {
    createdAt: '2025-01-10T02:00:00.000Z',
    dateOfBirth: '1985-04-12',
    departmentCode: 'clinical',
    fullName: 'Nguyễn Văn An',
    gender: 'male',
    id: 'staff-001',
    identityCardNumber: '001185000123',
    lastLoginAt: '2026-08-04T23:10:00.000Z',
    phoneNumber: '0912345678',
    roleCode: 'doctor',
    status: 'active',
    username: 'an.nguyen',
  },
  {
    createdAt: '2025-02-18T02:00:00.000Z',
    dateOfBirth: '1990-09-02',
    departmentCode: 'clinical',
    fullName: 'Trần Thị Bích',
    gender: 'female',
    id: 'staff-002',
    identityCardNumber: '001190000456',
    lastLoginAt: '2026-08-05T01:45:00.000Z',
    phoneNumber: '0987654321',
    roleCode: 'nurse',
    status: 'active',
    username: 'bich.tran',
  },
  {
    createdAt: '2025-03-05T02:00:00.000Z',
    dateOfBirth: '1992-11-20',
    departmentCode: 'laboratory',
    fullName: 'Lê Minh Châu',
    gender: 'female',
    id: 'staff-003',
    identityCardNumber: '001192000789',
    lastLoginAt: null,
    phoneNumber: '0932112233',
    roleCode: 'lab_tech',
    status: 'locked',
    username: 'chau.le',
  },
  {
    createdAt: '2025-05-22T02:00:00.000Z',
    dateOfBirth: '1988-06-30',
    departmentCode: 'pharmacy',
    fullName: 'Phạm Quốc Duy',
    gender: 'male',
    id: 'staff-004',
    identityCardNumber: '001188000321',
    lastLoginAt: '2026-08-05T00:05:00.000Z',
    phoneNumber: '0977889900',
    roleCode: 'pharmacist',
    status: 'active',
    username: 'duy.pham',
  },
  {
    createdAt: '2025-06-11T02:00:00.000Z',
    dateOfBirth: '1995-01-15',
    departmentCode: 'reception',
    fullName: 'Hoàng Thị Em',
    gender: 'female',
    id: 'staff-005',
    identityCardNumber: '001195000654',
    lastLoginAt: '2026-08-04T22:30:00.000Z',
    phoneNumber: '0966223344',
    roleCode: 'receptionist',
    status: 'active',
    username: 'em.hoang',
  },
];

export const initialServiceCatalog: ServiceCatalogItem[] = [
  {
    code: 'SVC-0001',
    coveredByHealthInsurance: true,
    departmentCode: 'clinical',
    healthInsuranceCeilingPrice: 150000,
    id: 'catalog-001',
    isActive: true,
    name: 'Khám bệnh chuyên khoa',
    price: 200000,
  },
  {
    code: 'SVC-0002',
    coveredByHealthInsurance: true,
    departmentCode: 'laboratory',
    healthInsuranceCeilingPrice: 80000,
    id: 'catalog-002',
    isActive: true,
    name: 'Xét nghiệm công thức máu',
    price: 120000,
  },
  {
    code: 'SVC-0003',
    coveredByHealthInsurance: false,
    departmentCode: 'dermatology',
    healthInsuranceCeilingPrice: null,
    id: 'catalog-003',
    isActive: true,
    name: 'Điều trị laser da liễu',
    price: 850000,
  },
  {
    code: 'SVC-0004',
    coveredByHealthInsurance: true,
    departmentCode: 'clinical',
    healthInsuranceCeilingPrice: 500000,
    id: 'catalog-004',
    isActive: true,
    name: 'Giường nội trú tiêu chuẩn / ngày',
    price: 600000,
  },
];

export const initialRevenueSnapshot: RevenueSnapshot = {
  bankTransferTotal: 32_400_000,
  cashTotal: 68_500_000,
  insuranceTotal: 71_200_000,
  momoTotal: 18_900_000,
  netRevenue: 182_400_000,
  periodLabel: 'Hôm nay',
  writeOffTotal: 4_200_000,
};

export const initialPaymentMethodBreakdown: PaymentMethodBreakdownRow[] = [
  { amount: 68_500_000, label: 'Tiền mặt', method: 'cash', percentOfTotal: 38 },
  { amount: 32_400_000, label: 'Chuyển khoản', method: 'transfer', percentOfTotal: 18 },
  { amount: 18_900_000, label: 'Ví MoMo', method: 'momo', percentOfTotal: 10 },
  { amount: 71_200_000, label: 'Bảo hiểm y tế', method: 'insurance', percentOfTotal: 34 },
];

export const initialBeds: BedRecord[] = [
  { bedNumber: 'G1', dailyRate: 200000, departmentCode: 'clinical', id: 'bed-001', roomNumber: 'P101', status: 'occupied' },
  { bedNumber: 'G2', dailyRate: 200000, departmentCode: 'clinical', id: 'bed-002', roomNumber: 'P101', status: 'occupied' },
  { bedNumber: 'G1', dailyRate: 200000, departmentCode: 'clinical', id: 'bed-003', roomNumber: 'P102', status: 'available' },
  { bedNumber: 'G2', dailyRate: 200000, departmentCode: 'clinical', id: 'bed-004', roomNumber: 'P102', status: 'occupied' },
  { bedNumber: 'G1', dailyRate: 250000, departmentCode: 'dermatology', id: 'bed-005', roomNumber: 'P201', status: 'available' },
  { bedNumber: 'G2', dailyRate: 250000, departmentCode: 'dermatology', id: 'bed-006', roomNumber: 'P201', status: 'occupied' },
  { bedNumber: 'G1', dailyRate: 250000, departmentCode: 'dermatology', id: 'bed-007', roomNumber: 'P202', status: 'maintenance' },
  { bedNumber: 'G1', dailyRate: 180000, departmentCode: 'laboratory', id: 'bed-008', roomNumber: 'P301', status: 'available' },
  { bedNumber: 'G2', dailyRate: 180000, departmentCode: 'laboratory', id: 'bed-009', roomNumber: 'P301', status: 'occupied' },
  { bedNumber: 'G1', dailyRate: 180000, departmentCode: 'laboratory', id: 'bed-010', roomNumber: 'P302', status: 'available' },
];

export const initialAuditLog: AuditLogEntry[] = [
  {
    action: 'LOGIN_SUCCESS',
    actorRoleCode: 'admin',
    actorUsername: 'admin',
    description: 'Đăng nhập thành công vào bảng điều khiển quản trị',
    id: 'audit-001',
    occurredAt: '2026-08-05T02:05:00.000Z',
    resource: 'auth',
    tone: 'green',
  },
  {
    action: 'STAFF_CREATE',
    actorRoleCode: 'admin',
    actorUsername: 'admin',
    description: 'Tạo tài khoản nhân viên mới: em.hoang',
    id: 'audit-002',
    occurredAt: '2026-08-05T01:40:00.000Z',
    resource: 'staff',
    resourceId: 'staff-005',
    tone: 'sky',
  },
  {
    action: 'STAFF_LOCK',
    actorRoleCode: 'admin',
    actorUsername: 'admin',
    description: 'Khóa tài khoản nhân viên: chau.le',
    id: 'audit-003',
    occurredAt: '2026-08-04T15:20:00.000Z',
    resource: 'staff',
    resourceId: 'staff-003',
    tone: 'amber',
  },
  {
    action: 'CATALOG_UPDATE',
    actorRoleCode: 'accountant',
    actorUsername: 'ketoan.dev',
    description: 'Cập nhật mức trần BHYT cho dịch vụ SVC-0004',
    id: 'audit-004',
    occurredAt: '2026-08-04T09:12:00.000Z',
    resource: 'service_catalog',
    resourceId: 'catalog-004',
    tone: 'teal',
  },
  {
    action: 'INVOICE_WRITE_OFF',
    actorRoleCode: 'accountant',
    actorUsername: 'ketoan.dev',
    description: 'Xóa nợ hóa đơn không thu hồi được (mã BN: BN-00231)',
    id: 'audit-005',
    occurredAt: '2026-08-03T14:02:00.000Z',
    resource: 'invoice',
    tone: 'red',
  },
];
