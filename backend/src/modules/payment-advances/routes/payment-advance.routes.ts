import { Router } from 'express';

import { attachDevPrincipal, requirePermission } from '../../../middlewares/requirePermission';
import { PAYMENT_ADVANCE_PERMISSIONS } from '../constants/payment-advance.constants';
import { paymentAdvanceController } from '../controllers/payment-advance.controller';

/** Router tạm ứng nội trú, mount dưới /api/v1. */
export const paymentAdvanceRouter = Router();

paymentAdvanceRouter.use(attachDevPrincipal);

paymentAdvanceRouter.post(
  '/medical-records/:recordId/payment-advances',
  requirePermission(PAYMENT_ADVANCE_PERMISSIONS.WRITE),
  (req, res, next) => {
    void paymentAdvanceController.createDeposit(req, res, next);
  },
);

paymentAdvanceRouter.post(
  '/medical-records/:recordId/payment-advances/refund',
  requirePermission(PAYMENT_ADVANCE_PERMISSIONS.WRITE),
  (req, res, next) => {
    void paymentAdvanceController.createRefund(req, res, next);
  },
);

paymentAdvanceRouter.get(
  '/medical-records/:recordId/payment-advances',
  requirePermission(PAYMENT_ADVANCE_PERMISSIONS.READ),
  (req, res, next) => {
    void paymentAdvanceController.list(req, res, next);
  },
);
