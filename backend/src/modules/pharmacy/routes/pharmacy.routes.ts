import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';

import { validateRequest } from '../../../core/http/validate-request';
import { authorizeAndAudit } from '../../../middlewares/authorize-and-audit';
import {
  getInventorySummaryController,
  listInventoryController,
  listStockMovementsController,
  listWarehousesController,
} from '../controllers/pharmacy.controller';
import {
  inventorySummaryQuerySchema,
  listInventoryQuerySchema,
  listStockMovementsQuerySchema,
} from '../schemas/pharmacy.schemas';
import { getInvalidStockMovementDateRangeError } from '../validators/stock-movement-date-range';

/**
 * @route   GET /api/v1/pharmacy/warehouses|inventory|inventory/summary|stock-movements
 * @desc    Tra cứu kho, tồn kho, tổng hợp tồn và lịch sử biến động thuốc/vật tư.
 * @access  Private (authorizeAndAudit với permission theo từng báo cáo)
 */
export const pharmacyRouter = Router();

/**
 * Chặn khoảng ngày đảo chiều trước khi query repository; lỗi có mã riêng để frontend hiển thị
 * đúng tại bộ lọc thay vì biến thành lỗi truy vấn chung.
 */
function validateStockMovementDateRange(req: Request, response: Response, next: NextFunction) {
  void response;
  const error = getInvalidStockMovementDateRangeError(req.query.from, req.query.to);
  if (error) {
    next(error);
    return;
  }

  next();
}

pharmacyRouter.get(
  '/warehouses',
  authorizeAndAudit('pharmacy.inventory.read'),
  listWarehousesController,
);

pharmacyRouter.get(
  '/inventory',
  authorizeAndAudit('pharmacy.inventory.read'),
  validateRequest({ query: listInventoryQuerySchema }),
  listInventoryController,
);

pharmacyRouter.get(
  '/inventory/summary',
  authorizeAndAudit('pharmacy.inventory.read'),
  validateRequest({ query: inventorySummaryQuerySchema }),
  getInventorySummaryController,
);

pharmacyRouter.get(
  '/stock-movements',
  authorizeAndAudit('pharmacy.report.read'),
  validateStockMovementDateRange,
  validateRequest({ query: listStockMovementsQuerySchema }),
  listStockMovementsController,
);
