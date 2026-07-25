import { Router } from 'express';
import { BedController } from './bed.controller';
import { asyncHandler } from '../../core/middlewares/asyncHandler';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

const router = Router();

router.use(authenticate);

router.get('/', authorize('inpatient.read'), asyncHandler((req, res) => BedController.getBeds(req, res)));
router.put('/:id/maintenance', authorize('bed.assign'), asyncHandler((req, res) => BedController.toggleMaintenance(req, res)));

export const bedRoutes = router;
