import { AppError } from '../../../core/errors/app-error';

export interface FefoPrescriptionItem {
  prescriptionItemId: string;
  medicineId: string;
  quantity: number;
}

export interface FefoBatch {
  batchId: string;
  batchNumber: string;
  expiryDate: Date;
  medicineId: string;
  quantity: number;
}

export interface FefoAllocation {
  batchId: string;
  batchNumber: string;
  expiryDate: Date;
  medicineId: string;
  prescriptionItemId: string;
  quantity: number;
}

interface AllocateFefoBatchesInput {
  batches: FefoBatch[];
  items: FefoPrescriptionItem[];
  today?: Date;
}

const startOfUtcDay = (value: Date) => Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());

/**
 * Phân bổ tồn kho theo FEFO cho từng dòng đơn, bỏ qua lô hết hạn và không làm thay đổi input.
 */
export function allocateFefoBatches({ batches, items, today = new Date() }: AllocateFefoBatchesInput): FefoAllocation[] {
  const todayUtc = startOfUtcDay(today);
  const remainingByBatchId = new Map(batches.map((batch) => [batch.batchId, batch.quantity]));
  const batchesByMedicineId = new Map<string, FefoBatch[]>();

  for (const batch of batches) {
    if (batch.quantity <= 0 || startOfUtcDay(batch.expiryDate) <= todayUtc) continue;
    const current = batchesByMedicineId.get(batch.medicineId) ?? [];
    current.push(batch);
    batchesByMedicineId.set(batch.medicineId, current);
  }

  for (const medicineBatches of batchesByMedicineId.values()) {
    medicineBatches.sort((left, right) => {
      const expiryDiff = left.expiryDate.getTime() - right.expiryDate.getTime();
      return expiryDiff === 0 ? left.batchNumber.localeCompare(right.batchNumber) : expiryDiff;
    });
  }

  const allocations: FefoAllocation[] = [];

  for (const item of items) {
    let remainingItemQuantity = item.quantity;
    const eligibleBatches = batchesByMedicineId.get(item.medicineId) ?? [];

    for (const batch of eligibleBatches) {
      if (remainingItemQuantity === 0) break;

      const remainingBatchQuantity = remainingByBatchId.get(batch.batchId) ?? 0;
      if (remainingBatchQuantity <= 0) continue;

      const allocatedQuantity = Math.min(remainingItemQuantity, remainingBatchQuantity);
      remainingItemQuantity -= allocatedQuantity;
      remainingByBatchId.set(batch.batchId, remainingBatchQuantity - allocatedQuantity);
      allocations.push({
        batchId: batch.batchId,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        medicineId: item.medicineId,
        prescriptionItemId: item.prescriptionItemId,
        quantity: allocatedQuantity,
      });
    }

    if (remainingItemQuantity > 0) {
      throw AppError.conflict(
        'INSUFFICIENT_STOCK',
        'Tồn kho khả dụng không đủ để ký đơn thuốc theo nguyên tắc FEFO.',
      );
    }
  }

  return allocations;
}
