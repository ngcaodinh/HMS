import type { NextFunction, Request, Response } from 'express';

import { sendPaginated, sendSuccess } from '../../../core/http/response';
import {
  getPharmacyInventorySummary,
  listInventory,
  listPharmacyWarehouses,
  listPharmacyStockMovements,
} from '../services/pharmacy.service';

/**
 * @route GET /api/v1/pharmacy/inventory
 * @desc Liệt kê tồn kho theo lô, có filter kho/từ khóa và phân trang.
 * @access pharmacist, admin
 */
export async function listInventoryController(req: Request, res: Response, next: NextFunction) {
  try {
    const { keyword, page, pageSize, warehouseId } = req.query as unknown as {
      keyword?: string;
      page: number;
      pageSize: number;
      warehouseId?: string;
    };
    const result = await listInventory({ keyword, page, pageSize, warehouseId });
    sendPaginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/pharmacy/inventory/summary
 * @desc Tính KPI tồn kho từ batch/movement thật, không dùng mock.
 * @access pharmacist, admin
 */
export async function getInventorySummaryController(req: Request, res: Response, next: NextFunction) {
  try {
    const { warehouseId } = req.query as { warehouseId?: string };
    const result = await getPharmacyInventorySummary({ warehouseId });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/pharmacy/warehouses
 * @desc Liệt kê kho dược đang hoạt động để màn cấp phát/kho dùng warehouseId thật.
 * @access pharmacist, admin
 */
export async function listWarehousesController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await listPharmacyWarehouses();
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/pharmacy/stock-movements
 * @desc Liệt kê biến động tồn kho immutable phục vụ báo cáo và audit dược.
 * @access pharmacist, admin
 */
export async function listStockMovementsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, medicineId, movementType, page, pageSize, to, warehouseId } = req.query as unknown as {
      from?: Date;
      medicineId?: string;
      movementType?: 'receipt' | 'prescription_sign' | 'prescription_cancel' | 'adjustment';
      page: number;
      pageSize: number;
      to?: Date;
      warehouseId?: string;
    };
    const result = await listPharmacyStockMovements({
      from,
      medicineId,
      movementType,
      page,
      pageSize,
      to,
      warehouseId,
    });
    sendPaginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
}
