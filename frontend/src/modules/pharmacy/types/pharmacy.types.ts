/**
 * @file pharmacy.types.ts
 * @description Định nghĩa các kiểu dữ liệu (TypeScript Types & Interfaces) cho Phân hệ Dược sĩ & Nhà thuốc
 * @author Senior Frontend Engineer
 */

/**
 * Định danh 5 màn hình làm việc chính của Dược sĩ
 */
export type PharmacyScreen = 'dispense' | 'inventory' | 'stock-import' | 'national-xml' | 'reports';

/**
 * Trạng thái của đơn thuốc điện tử
 */
export type PrescriptionStatus = 'pending' | 'dispensed' | 'cancelled';

/**
 * Phân loại loại hình khám chữa bệnh
 */
export type PatientType = 'outpatient' | 'inpatient';

/**
 * Chi tiết khoản thuốc trong đơn thuốc điện tử
 */
export interface PrescriptionItem {
  drugId: string;
  drugName: string;
  spec: string; // Dạng chế phẩm & quy cách (VD: Tuýp 30g)
  categoryLabel?: string; // Nhóm thuốc (VD: Thuốc bôi ngoài da)
  quantity: number; // Số lượng kê
  unit: string; // Đơn vị tính (tuýp, hộp, viên,...)
  dosageInstruction: string; // Liều dùng & hướng dẫn bác sĩ
  fefoLotNumber: string; // Lô đề xuất xuất kho FEFO
  shelfLocation: string; // Vị trí lưu kho (VD: Kệ A-02)
  availableStock: number; // Số lượng tồn kho lô đề xuất
  expiryDate: string; // Hạn sử dụng lô đề xuất (DD/MM/YYYY)
  isStockSufficient: boolean; // Đủ tồn kho hay không
}

/**
 * Đơn thuốc điện tử đã ký số bác sĩ
 */
export interface Prescription {
  id: string; // Mã đơn thuốc (VD: RX-2026-0891)
  patientId: string; // Mã BN (VD: BN-2026-0089)
  patientName: string; // Họ tên bệnh nhân
  patientAge: number;
  patientGender: 'Nam' | 'Nữ';
  bhytCardNumber?: string; // Số thẻ BHYT nếu có
  bhytRatio?: string; // Mức hưởng BHYT (VD: Ngoại trú BHYT 80%)
  patientType: PatientType;
  icdCode: string; // Mã ICD-10 (VD: L23.9)
  icdDiagnosis: string; // Tên chẩn đoán
  doctorName: string; // Bác sĩ kê đơn
  department: string; // Khoa / Phòng khám
  signedAt: string; // Thời điểm bác sĩ ký đơn
  isSigned: boolean; // Trạng thái đã ký số
  invoiceStatus: 'paid' | 'unpaid'; // Trạng thái thanh toán viện phí
  invoiceId?: string; // Mã hóa đơn (VD: #INV-2026-0312)
  hasAllergyWarning: boolean; // Có cảnh báo dị ứng hay không
  allergyWarningText?: string; // Nội dung cảnh báo dị ứng
  allergyOverrideReason?: string; // Lý do bác sĩ xác nhận ghi đè (Override)
  allergyOverrideMeta?: string; // Thông tin metadata người ghi đè
  items: PrescriptionItem[];
  status: PrescriptionStatus;
  warehouseId: string; // Kho xuất
}

/**
 * Chi tiết mặt hàng thuốc trong kho dược (FEFO Inventory Item)
 */
export interface InventoryItem {
  id: string; // Mã hệ thống
  code: string; // Mã thuốc (VD: THU-0012)
  name: string; // Tên thuốc & hoạt chất
  spec: string; // Dạng bào chế / Quy cách
  registrationNumber: string; // Số đăng ký (SDK)
  lotNumber: string; // Số lô (Batch)
  expiryDate: string; // Hạn sử dụng (DD/MM/YYYY)
  fefoPriority: 'FEFO Ưu tiên' | 'Cận hạn' | 'Tủ két sắt';
  currentStock: number; // Tồn kho hiện tại
  unit: string;
  minStock: number; // Tồn tối thiểu
  shelfLocation: string; // Vị trí kệ kho
  status: 'Đạt chuẩn' | 'Cảnh báo cận hạn' | 'Tồn dưới tối thiểu';
  category: 'topical' | 'antibiotic' | 'antihistamine' | 'special' | 'general';
}

/**
 * Dòng sản phẩm trong phiếu nhập kho dược
 */
export interface StockReceiptItem {
  id: string;
  drugName: string;
  lotNumber: string;
  manufactureDate: string;
  expiryDate: string;
  importQuantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Phiếu nhập kho dược từ Nhà cung cấp
 */
export interface StockReceipt {
  receiptCode: string; // Mã phiếu nhập (VD: #NKO-2026-0154)
  supplierName: string; // Tên nhà cung cấp
  invoiceNumber: string; // Số hóa đơn GTGT
  receiptDate: string; // Ngày nhập kho
  items: StockReceiptItem[];
  totalAmount: number;
  isXmlImported: boolean; // Đã Import bằng tệp XML hay chưa
}

/**
 * Nhật ký biến động xuất nhập tồn kho (Audit Log)
 */
export interface StockMovementLog {
  id: string; // Mã giao dịch (VD: SM-2026-0912)
  drugCode: string;
  drugName: string;
  lotNumber: string;
  movementType: string; // Loại biến động (Xuất phát đơn / Nhập kho)
  movementTypeBadge: 'paid' | 'blue' | 'warning' | 'error';
  quantityChange: number; // Số lượng thay đổi (dương hoặc âm)
  quantityChangeText: string; // Chuỗi hiển thị (VD: "- 2 tuýp")
  postStock: number; // Tồn kho sau giao dịch
  unit: string;
  executor: string; // Người thực hiện
  timestamp: string; // Thời gian thực hiện
}

/**
 * Chỉ số KPI tổng quan kho dược
 */
export interface PharmacyKpiSummary {
  totalDrugs: number;
  outpatientCount: number;
  inpatientCount: number;
  nearExpiryLotsCount: number;
  lowStockItemsCount: number;
  totalInventoryValueVnd: number;
}
