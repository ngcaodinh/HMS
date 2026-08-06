/**
 * @file pharmacy.types.ts
 * @description Kiểu view-model và dữ liệu mock dùng cho các màn hình pharmacy hiện hành.
 * Các field được ánh xạ từ response backend hoặc dữ liệu trình diễn; không phải hợp đồng cho phép
 * client tự quyết định ký đơn, paid gate, cấp phát hay trừ kho.
 */

/**
 * Định danh các màn hình làm việc chính của Dược sĩ.
 * Giá trị này chỉ phục vụ điều hướng UI; quyền truy cập vẫn do backend kiểm tra.
 */
export type PharmacyScreen = 'dispense' | 'inventory' | 'stock-import' | 'national-xml' | 'reports';

/**
 * Trạng thái view-model của đơn thuốc trong UI.
 * `pending`/`dispensed` được ánh xạ từ trạng thái backend và `dispensedAt`, không thay thế trạng thái
 * domain `active`/`xml_exported` hoặc kết quả command từ server.
 */
export type PrescriptionStatus = 'pending' | 'dispensed' | 'cancelled';

/**
 * Phân loại loại hình khám chữa bệnh dùng để hiển thị nhóm đơn.
 */
export type PatientType = 'outpatient' | 'inpatient';

/**
 * Chi tiết khoản thuốc trong view-model đơn thuốc.
 * Số lượng và tồn kho tính theo đơn vị thuốc; allocation FEFO, hạn dùng và cờ đủ tồn là snapshot
 * do backend cung cấp để hiển thị, không phải phép tính/ghi kho của client.
 */
export interface PrescriptionItem {
  drugId: string;
  drugName: string;
  spec: string; // Dạng chế phẩm và quy cách đóng gói.
  categoryLabel?: string; // Nhãn nhóm thuốc dùng cho bộ lọc/hiển thị.
  quantity: number; // Số lượng kê theo đơn vị thuốc.
  unit: string; // Đơn vị tính của dòng thuốc.
  dosageInstruction: string; // Liều dùng và hướng dẫn đã được bác sĩ kê.
  fefoLotNumber: string; // Lô FEFO do backend phân bổ hoặc snapshot trả về.
  shelfLocation: string; // Vị trí kho dùng để hiển thị cho dược sĩ.
  availableStock: number; // Số dư snapshot sau phân bổ, theo đơn vị thuốc.
  expiryDate: string; // Hạn dùng dạng hiển thị; nguồn API dùng ngày ISO.
  isStockSufficient: boolean; // Cờ hiển thị từ allocation server, không phải quyền trừ kho.
  fefoAllocations?: Array<{
    balanceAfter: number; // Số dư batch sau biến động, theo đơn vị thuốc.
    batchNumber: string;
    expiryDate: string; // Hạn dùng lô, dạng hiển thị sau khi mapping.
    quantityAllocated: number; // Số lượng backend đã phân bổ, theo đơn vị thuốc.
    warehouseName: string;
  }>;
}

/**
 * View-model đơn thuốc điện tử dùng cho danh sách/chi tiết pharmacy.
 * Chữ ký, thanh toán, cảnh báo dị ứng, allocation FEFO và XML là dữ liệu được backend quyết định;
 * các cờ trong type này chỉ hỗ trợ hiển thị và điều phối callback.
 */
export interface Prescription {
  id: string; // Mã dùng trong view-model.
  backendPrescriptionId?: string; // ID thật dùng cho API command.
  backendVersion?: number; // Version optimistic lock do backend trả về.
  prescriptionCode?: string | null;
  patientId: string; // Mã bệnh nhân dùng để tra cứu trong phạm vi quyền.
  patientName: string; // Tên hiển thị theo response được phân quyền.
  patientAge: number;
  patientGender: 'Nam' | 'Nữ';
  bhytCardNumber?: string; // Số thẻ BHYT nếu response có và caller được phép xem.
  bhytRatio?: string; // Nhãn mức hưởng BHYT đã được server/response cung cấp.
  patientType: PatientType;
  icdCode: string; // Mã ICD-10 từ hồ sơ bệnh án.
  icdDiagnosis: string; // Tên chẩn đoán từ hồ sơ bệnh án.
  doctorName: string; // Tên bác sĩ kê đơn trong phạm vi quyền.
  department: string; // Khoa/phòng của hồ sơ.
  signedAt: string; // Thời điểm ký; view-model có thể đã được format để hiển thị.
  isSigned: boolean; // Cờ hiển thị chữ ký đã được backend xác nhận.
  invoiceStatus: 'paid' | 'unpaid'; // Tín hiệu hiển thị; paid gate phải được backend kiểm tra lại.
  invoiceId?: string; // Mã hóa đơn nếu response có.
  hasAllergyWarning: boolean; // Có cảnh báo dị ứng do hồ sơ/đơn cung cấp.
  allergyWarningText?: string; // Nội dung cảnh báo đã được server cung cấp.
  allergyOverrideReason?: string; // Lý do override đã được bác sĩ lưu trên đơn.
  allergyOverrideMeta?: string; // Metadata hiển thị của thao tác override.
  items: PrescriptionItem[];
  status: PrescriptionStatus;
  warehouseId: string; // Kho xuất từ allocation/server response.
  warehouseName?: string;
  xmlExportedAt?: string | null; // Thời điểm XML được backend kết xuất, dạng ISO hoặc view format.
}

/**
 * Chi tiết mặt hàng thuốc trong view quản lý kho.
 * `currentStock` và các cờ trạng thái là số liệu server/mock để hiển thị; FEFO thực tế và mọi mutation
 * tồn kho phải đi qua backend.
 */
export interface InventoryItem {
  id: string; // Mã hệ thống.
  code: string; // Mã thuốc.
  name: string; // Tên thuốc và hoạt chất.
  spec: string; // Dạng bào chế/quy cách.
  registrationNumber: string; // Số đăng ký lưu hành.
  lotNumber: string; // Số lô.
  expiryDate: string; // Hạn dùng dạng ngày hiển thị hoặc ngày ISO tùy nguồn.
  fefoPriority: 'FEFO Ưu tiên' | 'Cận hạn' | 'Tủ két sắt';
  currentStock: number; // Tồn kho hiện tại theo đơn vị thuốc.
  unit: string;
  minStock: number; // Ngưỡng tồn tối thiểu theo đơn vị thuốc.
  shelfLocation: string; // Vị trí kệ kho.
  status: 'Đạt chuẩn' | 'Cảnh báo cận hạn' | 'Tồn dưới tối thiểu';
  category: 'topical' | 'antibiotic' | 'antihistamine' | 'special' | 'general';
}

/**
 * Dòng sản phẩm trong phiếu nhập kho trình diễn.
 * Số lượng là đơn vị thuốc; đơn giá/thành tiền là số nguyên VND và chỉ là dữ liệu form/mock cho luồng
 * nhập kho hiện hành, không tự ghi vào persistence.
 */
export interface StockReceiptItem {
  id: string;
  drugName: string;
  lotNumber: string;
  manufactureDate: string; // Ngày ISO `YYYY-MM-DD` trong form nhập kho.
  expiryDate: string; // Ngày ISO `YYYY-MM-DD` trong form nhập kho.
  importQuantity: number;
  unitPrice: number; // Đơn giá nguyên VND cho một đơn vị thuốc.
  totalPrice: number; // Thành tiền nguyên VND, thường bằng số lượng nhân đơn giá.
}

/**
 * Phiếu nhập kho dược từ nhà cung cấp trong luồng form/mock.
 * `totalAmount` là số nguyên VND; `isXmlImported` chỉ phản ánh nguồn nhập liệu trên UI và không khẳng
 * định XML đã được backend xác thực hay kho đã cập nhật.
 */
export interface StockReceipt {
  receiptCode: string; // Mã phiếu nhập.
  supplierName: string; // Tên nhà cung cấp
  invoiceNumber: string; // Số hóa đơn GTGT
  receiptDate: string; // Ngày nhập kho dạng ISO `YYYY-MM-DD` trong form.
  items: StockReceiptItem[];
  totalAmount: number; // Tổng tiền nguyên VND.
  isXmlImported: boolean; // UI đã đọc dữ liệu từ XML hay chưa.
}

/**
 * View-model nhật ký biến động xuất nhập tồn kho.
 * Đây là dữ liệu audit/read-only: số lượng thay đổi là số nguyên theo đơn vị thuốc, `postStock` là số dư
 * sau giao dịch và client không được dùng model này để tự điều chỉnh batch.
 */
export interface StockMovementLog {
  id: string; // Mã giao dịch.
  drugCode: string;
  drugName: string;
  lotNumber: string;
  movementType: string; // Loại biến động do backend phân loại.
  movementTypeBadge: 'paid' | 'blue' | 'warning' | 'error';
  quantityChange: number; // Số lượng thay đổi, dương hoặc âm theo đơn vị thuốc.
  quantityChangeText: string; // Chuỗi hiển thị đã format theo đơn vị thuốc.
  postStock: number; // Tồn kho sau giao dịch, theo đơn vị thuốc.
  unit: string;
  executor: string; // Người thực hiện
  timestamp: string; // Thời gian thực hiện, nên giữ theo ISO trước khi format hiển thị.
}

/**
 * Chỉ số KPI tổng quan kho dược.
 * Các count là số batch/đơn/lô hoặc số lượng nguyên; `totalInventoryValueVnd` là giá trị nguyên VND
 * do nguồn dữ liệu cung cấp, không phải phép tính phía component.
 */
export interface PharmacyKpiSummary {
  totalDrugs: number;
  outpatientCount: number;
  inpatientCount: number;
  nearExpiryLotsCount: number;
  lowStockItemsCount: number;
  totalInventoryValueVnd: number;
}
