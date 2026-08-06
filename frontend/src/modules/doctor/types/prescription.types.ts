/** Trạng thái đơn thuốc (`draft`, `active`, `xml_exported`, `cancelled`); backend là nguồn quyết định. */
export type PrescriptionStatus = 'draft' | 'active' | 'xml_exported' | 'cancelled';

/** Thuốc có thể được chọn khi kê đơn; unitPrice giữ dạng chuỗi theo wire contract. */
export interface MedicineOption {
  medicineId: string;
  name: string;
  activeIngredient: string | null;
  dosage: string | null;
  unit: string;
  unitPrice: string;
  coveredByHealthInsurance: boolean;
}

/** Một dòng đơn thuốc đã lưu; quantity là số lượng, days là số ngày và snapshot giữ tên/hoạt chất. */
export interface PrescriptionItem {
  prescriptionItemId: string;
  medicineId: string;
  medicineNameSnapshot: string | null;
  activeIngredientSnapshot: string | null;
  quantity: number;
  days: number;
  dosePerUse?: string | null;
  usesPerDay?: number | null;
  useTiming?: string | null;
  dosageInstruction: string;
  unitPrice: string;
  total: string;
}

/** Đơn thuốc gắn với hồ sơ khám, gồm version để kiểm soát cập nhật đồng thời. */
export interface Prescription {
  prescriptionId: string;
  recordId: string;
  status: PrescriptionStatus;
  isSigned: boolean;
  signedAt: string | null;
  xmlExportedAt: string | null;
  allergyOverrideReason: string | null;
  items: PrescriptionItem[];
  version: number;
}

/** Kết quả lấy đơn gần nhất; prescription có thể null khi hồ sơ chưa có đơn thuốc. */
export interface LatestPrescriptionResponse {
  prescription: Prescription | null;
  hasActivePrescription: boolean;
}

/** Dòng đơn thuốc nháp cục bộ chưa gửi lên server, dùng cho state nhập liệu của màn hình bác sĩ. */
export interface DraftRxLine {
  medicineId: string;
  name: string;
  activeIngredient: string | null;
  /** Giữ chuỗi thô để hiển thị lỗi ngay khi người dùng nhập số âm, rỗng hoặc thập phân. */
  quantity: string;
  days: string;
  dosePerUse: string;
  useTiming: string;
}
