import { Router } from 'express';

import {
  attachDevPrincipal,
  requirePermission,
} from '../../../middlewares/require-permission';
import { patientController } from '../controllers/patient.controller';

/**
 * @route   /api/v1/patients
 * @desc    Tra cứu bệnh nhân và chuẩn hóa danh tính cấp cứu.
 * @access  Private, yêu cầu permission tương ứng.
 */
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
