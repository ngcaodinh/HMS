import { Router } from 'express';

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
  validateRequest({ query: listStockMovementsQuerySchema }),
  listStockMovementsController,
);
