import { Router } from 'express';
import { BedController } from './bed.controller';
import { asyncHandler } from '../../core/middlewares/async-handler';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

/**
 * @route   /api/v1/beds
 * @desc    Tra cứu giường bệnh và cập nhật trạng thái bảo trì.
 * @access  Private, yêu cầu quyền inpatient.read hoặc bed.assign.
 */
const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('inpatient.read'),
  asyncHandler((req, res) => BedController.getBeds(req, res)),
);
router.put(
  '/:id/maintenance',
  authorize('bed.assign'),
  asyncHandler((req, res) => BedController.toggleMaintenance(req, res)),
);

export const bedRoutes = router;
