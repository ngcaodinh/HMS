import type { StockMovementType } from '@prisma/client';

import {
  getInventorySummary,
  listActiveWarehouses,
  listInventoryBatches,
  listStockMovements,
} from '../repositories/pharmacy.repository';

interface PaginationInput {
  page: number;
  pageSize: number;
}

export interface ListInventoryInput extends PaginationInput {
  keyword?: string;
  warehouseId?: string;
}

export interface ListStockMovementsInput extends PaginationInput {
  from?: Date;
  medicineId?: string;
  movementType?: StockMovementType;
  to?: Date;
  warehouseId?: string;
}

function getDaysToExpiry(expiryDate: Date): number {
  const today = new Date();
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const utcExpiry = Date.UTC(expiryDate.getUTCFullYear(), expiryDate.getUTCMonth(), expiryDate.getUTCDate());
  return Math.ceil((utcExpiry - utcToday) / 86_400_000);
}

/**
 * Trả danh sách tồn theo batch để UI ưu tiên FEFO và cảnh báo lô cận hạn/thấp tồn.
 */
export async function listInventory(input: ListInventoryInput) {
  const [batches, totalItems] = await listInventoryBatches(input);

  return {
    data: batches.map((batch) => {
      const daysToExpiry = getDaysToExpiry(batch.expiryDate);
      return {
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        daysToExpiry,
        expiryDate: batch.expiryDate,
        importPrice: batch.importPrice.toString(),
        isExpired: daysToExpiry <= 0,
        isExpiringSoon: daysToExpiry > 0 && daysToExpiry <= 30,
        isLowStock: batch.quantity <= 10,
        medicine: {
          activeIngredient: batch.medicine.activeIngredient,
          code: batch.medicine.code,
          coveredByHealthInsurance: batch.medicine.coveredByHealthInsurance,
          dosage: batch.medicine.dosage,
          medicineId: batch.medicine.id,
          name: batch.medicine.name,
          unit: batch.medicine.unit,
        },
        quantity: batch.quantity,
        version: batch.version,
        warehouse: {
          code: batch.warehouse.code,
          name: batch.warehouse.name,
          warehouseId: batch.warehouse.id,
        },
      };
    }),
    pagination: { page: input.page, pageSize: input.pageSize, totalItems },
  };
}

/**
 * Trả KPI tồn kho server-derived để dashboard dược không phụ thuộc số mock ở frontend.
 */
export function getPharmacyInventorySummary(input: { warehouseId?: string }) {
  return getInventorySummary(input);
}

/** Trả danh sách kho đang hoạt động để các màn dược chọn đúng warehouseId thật. */
export async function listPharmacyWarehouses() {
  const warehouses = await listActiveWarehouses();

  return warehouses.map((warehouse) => ({
    code: warehouse.code,
    name: warehouse.name,
    warehouseId: warehouse.id,
  }));
}

/**
 * Trả báo cáo movement theo filter, dùng cho bảng biến động kho và đối soát FEFO.
 */
export async function listPharmacyStockMovements(input: ListStockMovementsInput) {
  const [movements, totalItems] = await listStockMovements(input);

  return {
    data: movements.map((movement) => ({
      actorUserId: movement.actorUserId,
      balanceAfter: movement.balanceAfter,
      batch: {
        batchId: movement.batch.id,
        batchNumber: movement.batch.batchNumber,
        expiryDate: movement.batch.expiryDate,
      },
      createdAt: movement.createdAt,
      medicine: {
        code: movement.medicine.code,
        medicineId: movement.medicine.id,
        name: movement.medicine.name,
      },
      movementId: movement.id,
      movementType: movement.movementType,
      prescriptionId: movement.prescriptionId,
      quantityChange: movement.quantityChange,
      referenceId: movement.referenceId,
      referenceType: movement.referenceType,
      warehouse: {
        code: movement.warehouse.code,
        name: movement.warehouse.name,
        warehouseId: movement.warehouse.id,
      },
    })),
    pagination: { page: input.page, pageSize: input.pageSize, totalItems },
  };
}
