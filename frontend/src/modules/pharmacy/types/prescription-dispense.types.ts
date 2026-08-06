/**
 * Hợp đồng response của worklist cấp phát thuốc.
 * Mốc thời gian do backend trả về theo ISO 8601; allocation FEFO, trạng thái hóa đơn, `version`
 * và các mốc ký/cấp phát là dữ liệu server-derived. Client chỉ hiển thị và gửi command có version,
 * không tự xác nhận paid, phân bổ FEFO, cấp phát hoặc trừ kho.
 */

/** Trạng thái đơn đã ký trong worklist; `xml_exported` là đơn đã kết xuất XML thành công. */
export type DispensablePrescriptionStatus = 'active' | 'xml_exported';

/**
 * Phân bổ thuốc theo FEFO được backend snapshot từ stock movement khi xử lý đơn.
 * Số lượng và `balanceAfter` là số nguyên theo đơn vị thuốc; hạn dùng là ngày ISO.
 */
export interface FefoAllocation {
  balanceAfter: number;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantityAllocated: number;
  warehouse: {
    code: string;
    name: string;
    warehouseId: string;
  };
}

/** Một dòng thuốc với snapshot kê đơn và các lô FEFO server-derived tương ứng. */
export interface DispensablePrescriptionItem {
  prescriptionItemId: string;
  medicineNameSnapshot: string | null;
  activeIngredientSnapshot: string | null;
  dosageSnapshot: string | null;
  quantity: number;
  /** Số ngày dùng thuốc, tính theo ngày lịch và lấy từ đơn đã ký. */
  days: number;
  dosePerUse?: string | null;
  useTiming?: string | null;
  dosageInstruction: string;
  fefoAllocations: FefoAllocation[];
}

/**
 * Đơn thuốc đủ điều kiện xuất hiện trong worklist cấp phát.
 * Dữ liệu bệnh nhân và dị ứng chỉ phục vụ kiểm tra/hiển thị trong phạm vi quyền; UI không thay thế
 * authorization ở backend. `invoice.status = 'paid'` là tín hiệu hiển thị, còn paid gate được backend
 * kiểm tra lại khi nhận command cấp phát.
 */
export interface DispensablePrescription {
  prescriptionId: string;
  prescriptionCode: string | null;
  status: DispensablePrescriptionStatus;
  /** Thời điểm ký đơn theo ISO 8601; null khi response chưa có dữ liệu. */
  signedAt: string | null;
  /** Thời điểm backend ghi nhận cấp phát theo ISO 8601; null khi chưa cấp phát. */
  dispensedAt: string | null;
  dispensedBy: string | null;
  allergyOverrideReason: string | null;
  allergyOverrideAt: string | null;
  /** Thời điểm backend kết xuất XML thành công theo ISO 8601; null nếu chưa kết xuất. */
  xmlExportedAt: string | null;
  /** Hóa đơn liên quan; `paid` không được suy diễn thành quyền cấp phát ở client. */
  invoice: { invoiceId: string; status: 'pending' | 'paid' } | null;
  warehouse: {
    code: string;
    name: string;
    warehouseId: string;
  } | null;
  patient: {
    patientId: string;
    patientCode: string;
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female';
    allergies: string | null;
    healthInsuranceCode: string | null;
  };
  department: { name: string } | null;
  prescribingDoctor: { fullName: string };
  diagnosis: { icd10: string; diagnosisText: string | null } | null;
  items: DispensablePrescriptionItem[];
  /** Version optimistic lock; phải gửi lại nguyên giá trị khi gọi command cập nhật đơn. */
  version: number;
}
