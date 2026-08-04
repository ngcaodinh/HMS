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

export const pharmacyRouter = Router();

/**
 * Chặn khoảng ngày đảo chiều trước khi query repository; lỗi có mã riêng để frontend hiển thị
 * đúng tại bộ lọc thay vì biến thành lỗi truy vấn chung.
 */
function validateStockMovementDateRange(req: Request, _res: Response, next: NextFunction) {
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
