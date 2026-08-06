import { Router } from 'express';

import { attachDevPrincipal, requirePermission } from '../../../middlewares/require-permission';
import { queueController } from '../controllers/queue.controller';

/**
 * @route   GET|POST /api/v1/queue-tickets*; GET /api/v1/public/queue-display
 * @desc    Phát số, gọi số, bỏ qua, đọc lại và hiển thị trạng thái hàng đợi.
 * @access  Public cho kiosk/màn hình/reprint; Private cho thao tác nhân viên (requirePermission).
 */
export const queueRouter = Router();

// Public: kiosk phát số, màn hình LED hiển thị và in lại phiếu.
queueRouter.post('/queue-tickets', (req, res, next) => queueController.issueTicket(req, res, next));
queueRouter.post('/queue-tickets/:ticketId/print', (req, res, next) =>
  queueController.reprintTicket(req, res, next),
);
queueRouter.get('/public/queue-display', (req, res, next) =>
  queueController.getPublicDisplay(req, res, next),
);

// Staff
queueRouter.use(attachDevPrincipal);

queueRouter.get('/queue-tickets', requirePermission('queue.read'), (req, res, next) =>
  queueController.listTickets(req, res, next),
);

queueRouter.post('/queue-tickets/call-next', requirePermission('queue.call'), (req, res, next) =>
  queueController.callNext(req, res, next),
);

queueRouter.post('/queue-tickets/desk', requirePermission('queue.manage'), (req, res, next) =>
  queueController.issueDeskTicket(req, res, next),
);

queueRouter.post(
  '/queue-tickets/:ticketId/skip',
  requirePermission('queue.manage'),
  (req, res, next) => queueController.skipTicket(req, res, next),
);

queueRouter.post(
  '/queue-tickets/:ticketId/reannounce',
  requirePermission('queue.call'),
  (req, res, next) => queueController.reannounceTicket(req, res, next),
);

queueRouter.post(
  '/queue-tickets/:ticketId/recall',
  requirePermission('queue.manage'),
  (req, res, next) => queueController.recallTicket(req, res, next),
);
