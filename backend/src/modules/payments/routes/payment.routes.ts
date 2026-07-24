import { Router } from 'express';

import {
  attachDevPrincipal,
  requirePermission,
} from '../../../middlewares/requirePermission';
import { paymentController } from '../controllers/payment.controller';

/**
 * Payment HTTP routes — mount dưới /api/v1.
 */
export const paymentRouter = Router();

// Public IPN — không JWT
paymentRouter.post('/webhooks/momo', (req, res, next) =>
  paymentController.momoWebhook(req, res, next),
);

paymentRouter.use(attachDevPrincipal);

paymentRouter.post(
  '/invoices/:invoiceId/cash-payments',
  requirePermission('payment.cash.create'),
  (req, res, next) => paymentController.cashPay(req, res, next),
);

paymentRouter.post(
  '/invoices/:invoiceId/momo-payment-requests',
  requirePermission('payment.momo.create'),
  (req, res, next) => paymentController.createMomo(req, res, next),
);

paymentRouter.get(
  '/invoices/:invoiceId/payment-status',
  requirePermission('payment.read'),
  (req, res, next) => paymentController.paymentStatus(req, res, next),
);

paymentRouter.post(
  '/invoices/:invoiceId/momo-sync',
  requirePermission('payment.read'),
  (req, res, next) => paymentController.syncMomo(req, res, next),
);
