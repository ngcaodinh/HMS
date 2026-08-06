import { Router } from 'express';

import { attachDevPrincipal, requirePermission } from '../../../middlewares/require-permission';
import { paymentController } from '../controllers/payment.controller';

/**
 * @route   POST /api/v1/webhooks/momo; GET|POST /api/v1/invoices/:invoiceId/*
 * @desc    Tiếp nhận IPN MoMo và điều phối thanh toán tiền mặt, MoMo, tra cứu và đồng bộ trạng thái.
 * @access  Public cho IPN MoMo; Private cho các API hóa đơn (requirePermission).
 */
export const paymentRouter = Router();

// IPN MoMo là endpoint public; chữ ký và payload được kiểm tra ở payment controller/service.
paymentRouter.post('/webhooks/momo', (req, res) => paymentController.momoWebhook(req, res));

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
