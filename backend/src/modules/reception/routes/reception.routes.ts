import { Router } from 'express';

import {
  attachDevPrincipal,
  requirePermission,
} from '../../../middlewares/require-permission';
import { receptionController } from '../controllers/reception.controller';

/**
 * @route   /api/v1/receptions
 * @desc    Tiếp nhận bệnh nhân thường và cấp cứu.
 * @access  Private, yêu cầu permission reception hoặc emergency tương ứng.
 */
export const receptionRouter = Router();

receptionRouter.use(attachDevPrincipal);

receptionRouter.get(
  '/receptions/doctors',
  requirePermission('reception.create'),
  (req, res, next) => receptionController.listDoctors(req, res, next),
);

receptionRouter.post(
  '/receptions',
  requirePermission('reception.create'),
  (req, res, next) => receptionController.create(req, res, next),
);

receptionRouter.post(
  '/receptions/emergency',
  requirePermission('emergency.create'),
  (req, res, next) => receptionController.createEmergency(req, res, next),
);
