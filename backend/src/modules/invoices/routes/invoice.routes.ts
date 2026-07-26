import { Router } from 'express';

import {
  attachDevPrincipal,
  requirePermission,
} from '../../../middlewares/requirePermission';
import { invoiceController } from '../controllers/invoice.controller';

/**
 * Invoice HTTP routes — mount dưới /api/v1.
 */
export const invoiceRouter = Router();

invoiceRouter.use(attachDevPrincipal);

invoiceRouter.post(
  '/invoices',
  requirePermission('invoice.create'),
  (req, res, next) => invoiceController.create(req, res, next),
);

invoiceRouter.get(
  '/invoices',
  requirePermission('invoice.read'),
  (req, res, next) => invoiceController.list(req, res, next),
);

invoiceRouter.get(
  '/invoices/:invoiceId',
  requirePermission('invoice.read'),
  (req, res, next) => invoiceController.getById(req, res, next),
);

invoiceRouter.post(
  '/invoices/:invoiceId/cancel',
  requirePermission('invoice.cancel'),
  (req, res, next) => invoiceController.cancel(req, res, next),
);
