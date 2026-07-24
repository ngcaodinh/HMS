import { Router } from 'express';

import {
  attachDevPrincipal,
  requirePermission,
} from '../../../middlewares/requirePermission';
import { receptionController } from '../controllers/reception.controller';

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
