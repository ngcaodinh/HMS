import { z } from 'zod';

/**
 * Hợp đồng dữ liệu tồn kho và biến động kho sau khi được kiểm tra ở biên API.
 * Ngày giờ là chuỗi do backend trả về; số lượng và số dư là số nguyên theo đơn vị của thuốc.
 * Các cờ FEFO, hết hạn và thiếu tồn chỉ là dữ liệu server-derived để UI hiển thị, không phải
 * quyết định được phép cấp phát hay thao tác trừ kho ở phía client.
 */

/** Tóm tắt kho đang hoạt động để bộ lọc gửi đúng `warehouseId` về backend. */
export const warehouseSummarySchema = z.object({
  code: z.string(),
  name: z.string(),
  warehouseId: z.string(),
});

/** Snapshot danh mục thuốc đi kèm một batch tồn kho; không phải dữ liệu để sửa danh mục. */
const medicineSummarySchema = z.object({
  activeIngredient: z.string().nullable(),
  code: z.string().nullable(),
  coveredByHealthInsurance: z.boolean(),
  dosage: z.string().nullable(),
  medicineId: z.string(),
  name: z.string(),
  unit: z.string(),
});

/**
 * Một batch tồn kho do backend tính theo FEFO.
 * `expiryDate` dùng định dạng ngày ISO; `importPrice` là chuỗi Decimal để không mất độ chính xác
 * tiền tệ khi đi qua JSON; `daysToExpiry` tính theo ngày lịch.
 */
export const pharmacyInventoryBatchSchema = z.object({
  batchId: z.string(),
  batchNumber: z.string(),
  daysToExpiry: z.number().int(),
  /** Ngày hết hạn dạng ISO `YYYY-MM-DD` từ API. */
  expiryDate: z.string(),
  /** Giá nhập dạng chuỗi Decimal theo đơn vị VND, không parse thành float ở UI. */
  importPrice: z.string(),
  /** Backend đánh dấu true khi batch đã hết hạn (`daysToExpiry <= 0`). */
  isExpired: z.boolean(),
  /** Backend đánh dấu true khi còn hạn nhưng trong ngưỡng cận hạn hiện hành (tối đa 30 ngày). */
  isExpiringSoon: z.boolean(),
  /** Backend đánh dấu true khi số lượng batch dưới ngưỡng tồn thấp hiện hành (tối đa 10 đơn vị). */
  isLowStock: z.boolean(),
  medicine: medicineSummarySchema,
  quantity: z.number().int(),
  version: z.number().int(),
  warehouse: warehouseSummarySchema,
});

/** Tổng hợp số batch và số lượng tồn; các giá trị đều là số nguyên do backend tính. */
export const pharmacyInventorySummarySchema = z.object({
  /** Số batch đã hết hạn. */
  expiredBatches: z.number().int(),
  /** Số batch còn hạn nhưng nằm trong ngưỡng cận hạn. */
  expiringSoonBatches: z.number().int(),
  /** Số batch dưới ngưỡng tồn thấp của backend. */
  lowStockBatches: z.number().int(),
  /** Tổng số batch, không phải tổng số đơn vị thuốc. */
  totalBatches: z.number().int(),
  /** Tổng số lượng thuốc nguyên theo đơn vị lưu kho. */
  totalQuantity: z.number().int(),
});

/** Các loại biến động bất biến dùng cho báo cáo/audit: nhập, xuất theo ký đơn, hoàn đơn và điều chỉnh. */
export const stockMovementTypeSchema = z.enum([
  'receipt',
  'prescription_sign',
  'prescription_cancel',
  'adjustment',
]);

/**
 * Một bản ghi stock movement do backend lưu để đối soát.
 * `quantityChange` tính theo đơn vị thuốc: xuất theo đơn thường âm, nhập/hoàn đơn thường dương;
 * `balanceAfter` là số dư sau giao dịch. Client chỉ đọc và lọc báo cáo này.
 */
export const pharmacyStockMovementSchema = z.object({
  actorUserId: z.string().nullable(),
  /** Số dư batch sau movement, tính theo đơn vị thuốc. */
  balanceAfter: z.number().int(),
  batch: z.object({
    batchId: z.string(),
    batchNumber: z.string(),
    /** Hạn dùng batch dạng ISO `YYYY-MM-DD` từ API. */
    expiryDate: z.string(),
  }),
  /** Thời điểm ghi movement dạng ISO 8601. */
  createdAt: z.string(),
  medicine: z.object({
    code: z.string().nullable(),
    medicineId: z.string(),
    name: z.string(),
  }),
  movementId: z.string(),
  movementType: stockMovementTypeSchema,
  prescriptionId: z.string().nullable(),
  /** Số lượng thay đổi nguyên theo đơn vị thuốc; dấu âm/dương do backend xác định. */
  quantityChange: z.number().int(),
  referenceId: z.string().nullable(),
  referenceType: z.string().nullable(),
  warehouse: warehouseSummarySchema,
});

export type PharmacyInventoryBatch = z.infer<typeof pharmacyInventoryBatchSchema>;
export type PharmacyInventorySummary = z.infer<typeof pharmacyInventorySummarySchema>;
export type PharmacyStockMovement = z.infer<typeof pharmacyStockMovementSchema>;
export type PharmacyWarehouse = z.infer<typeof warehouseSummarySchema>;
export type StockMovementType = z.infer<typeof stockMovementTypeSchema>;
