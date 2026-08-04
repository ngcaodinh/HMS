import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../core/errors/app-error';
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

export const pharmacyRouter = Router();

/**
 * Chặn khoảng ngày đảo chiều trước khi query repository; lỗi này có mã riêng để frontend
 * hiển thị đúng tại bộ lọc thay vì biến thành lỗi truy vấn chung.
 */
function validateStockMovementDateRange(req: Request, _res: Response, next: NextFunction) {
  const { from, to } = req.query;
  if (typeof from !== 'string' || typeof to !== 'string') {
    next();
    return;
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime()) && fromDate > toDate) {
    next(AppError.badRequest(
      'INVALID_DATE_RANGE',
      'Khoảng thời gian không hợp lệ (từ ngày phải trước đến ngày).',
      [{ field: 'from', rule: 'from must be before or equal to to' }],
    ));
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
