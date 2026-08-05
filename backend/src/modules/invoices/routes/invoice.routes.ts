import { Router } from 'express';

import { attachDevPrincipal, requirePermission } from '../../../middlewares/requirePermission';
import { invoiceController } from '../controllers/invoice.controller';

/**
 * Invoice HTTP routes — mount dưới /api/v1.
 */
export const invoiceRouter = Router();

invoiceRouter.use(attachDevPrincipal);

invoiceRouter.post('/invoices', requirePermission('invoice.create'), (req, res, next) => {
  void invoiceController.create(req, res, next);
});

invoiceRouter.get('/invoices', requirePermission('invoice.read'), (req, res, next) => {
  void invoiceController.list(req, res, next);
});

invoiceRouter.get('/accounting-reports', requirePermission('invoice.read'), (req, res, next) => {
  void invoiceController.accountingReport(req, res, next);
});

invoiceRouter.get('/invoice-candidates', requirePermission('invoice.read'), (req, res, next) => {
  void invoiceController.listCandidates(req, res, next);
});

invoiceRouter.get('/invoices/:invoiceId', requirePermission('invoice.read'), (req, res, next) => {
  void invoiceController.getById(req, res, next);
});

invoiceRouter.post(
  '/invoices/:invoiceId/cancel',
  requirePermission('invoice.cancel'),
  (req, res, next) => {
    void invoiceController.cancel(req, res, next);
  },
);

/**
 * @route   POST /api/v1/invoices/:invoiceId/write-off
 * @desc    Ghi nhận miễn giảm thất thu cho ca cấp cứu đặc biệt.
 * @access  Private (permission invoice.write_off)
 */
invoiceRouter.post(
  '/invoices/:invoiceId/write-off',
  requirePermission('invoice.write_off'),
  (req, res, next) => {
    void invoiceController.writeOff(req, res, next);
  },
);
