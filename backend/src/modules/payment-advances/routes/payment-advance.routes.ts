import { Router } from 'express';

import { attachDevPrincipal, requirePermission } from '../../../middlewares/require-permission';
import { PAYMENT_ADVANCE_PERMISSIONS } from '../constants/payment-advance.constants';
import { paymentAdvanceController } from '../controllers/payment-advance.controller';

/**
 * @route   GET|POST /api/v1/medical-records/:recordId/payment-advances[/*]
 * @desc    Tạo, hoàn và tra cứu các khoản tạm ứng của hồ sơ nội trú.
 * @access  Private (requirePermission với quyền đọc/ghi tạm ứng)
 */
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
