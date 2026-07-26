import type { Prisma, StockMovementType } from '@prisma/client';

import { prisma } from '../../../core/db/prisma-client';

export interface InventoryListFilters {
  keyword?: string;
  page: number;
  pageSize: number;
  warehouseId?: string;
}

export interface InventorySummaryFilters {
  warehouseId?: string;
}

export interface StockMovementListFilters {
  from?: Date;
  medicineId?: string;
  movementType?: StockMovementType;
  page: number;
  pageSize: number;
  to?: Date;
  warehouseId?: string;
}

const inventoryInclude = {
  medicine: true,
  warehouse: true,
} as const;

function buildInventoryWhere(filters: InventoryListFilters): Prisma.MedicineBatchWhereInput {
  return {
    isActive: true,
    ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {}),
    ...(filters.keyword
      ? {
          OR: [
            { batchNumber: { contains: filters.keyword } },
            { medicine: { name: { contains: filters.keyword } } },
            { medicine: { activeIngredient: { contains: filters.keyword } } },
          ],
        }
      : {}),
  };
}

/** Đọc danh sách lô còn hiệu lực để màn kho thuốc hiển thị tồn thực theo kho. */
export function listInventoryBatches(filters: InventoryListFilters) {
  const where = buildInventoryWhere(filters);

  return Promise.all([
    prisma.medicineBatch.findMany({
      where,
      include: inventoryInclude,
      orderBy: [{ expiryDate: 'asc' }, { batchNumber: 'asc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.medicineBatch.count({ where }),
  ]);
}

/** Đọc danh sách kho dược đang hoạt động để UI không hard-code mã kho FEFO. */
export function listActiveWarehouses() {
  return prisma.pharmacyWarehouse.findMany({
    where: { isActive: true },
    orderBy: [{ code: 'asc' }, { name: 'asc' }],
  });
}

/** Tính KPI tồn kho từ dữ liệu batch server-side, không lấy số mock từ client. */
export async function getInventorySummary(filters: InventorySummaryFilters) {
  const now = new Date();
  const expiringSoon = new Date(now);
  expiringSoon.setDate(expiringSoon.getDate() + 30);

  const where: Prisma.MedicineBatchWhereInput = {
    isActive: true,
    ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {}),
  };

  const [quantity, totalBatches, lowStockBatches, expiringSoonBatches, expiredBatches] = await Promise.all([
    prisma.medicineBatch.aggregate({ where, _sum: { quantity: true } }),
    prisma.medicineBatch.count({ where }),
    prisma.medicineBatch.count({ where: { ...where, quantity: { lte: 10 } } }),
    prisma.medicineBatch.count({ where: { ...where, expiryDate: { gt: now, lte: expiringSoon } } }),
    prisma.medicineBatch.count({ where: { ...where, expiryDate: { lte: now } } }),
  ]);

  return {
    expiredBatches,
    expiringSoonBatches,
    lowStockBatches,
    totalBatches,
    totalQuantity: quantity._sum.quantity ?? 0,
  };
}

/** Đọc movement immutable để báo cáo biến động kho và điều tra audit nghiệp vụ dược. */
export function listStockMovements(filters: StockMovementListFilters) {
  const where: Prisma.StockMovementWhereInput = {
    ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {}),
    ...(filters.medicineId ? { medicineId: filters.medicineId } : {}),
    ...(filters.movementType ? { movementType: filters.movementType } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  return Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        batch: true,
        medicine: true,
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.stockMovement.count({ where }),
  ]);
}
