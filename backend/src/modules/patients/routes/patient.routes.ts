import { Router } from 'express';

import {
  attachDevPrincipal,
  requirePermission,
} from '../../../middlewares/requirePermission';
import { patientController } from '../controllers/patient.controller';

export const patientRouter = Router();

patientRouter.use(attachDevPrincipal);

patientRouter.get(
  '/patients',
  requirePermission('patient.search'),
  (req, res, next) => patientController.search(req, res, next),
);

patientRouter.patch(
  '/patients/:patientId/emergency-identity',
  requirePermission('emergency.identity.normalize'),
  (req, res, next) => patientController.normalizeEmergencyIdentity(req, res, next),
);
