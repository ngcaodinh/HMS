import { Router } from 'express';
import { SpecimenController } from './specimen.controller';
import { asyncHandler } from '../../core/middlewares/asyncHandler';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

const router = Router();

router.use(authenticate);

router.get(
  '/specimens',
  authorize('specimen.read'),
  asyncHandler((req, res) => SpecimenController.listSpecimens(req, res))
);

router.post(
  '/specimens',
  authorize('specimen.create'),
  asyncHandler((req, res) => SpecimenController.createSpecimen(req, res))
);

router.post(
  '/specimens/:id/collect',
  authorize('specimen.collect'),
  asyncHandler((req, res) => SpecimenController.collectSpecimen(req, res))
);

router.post(
  '/specimens/:id/print-barcode',
  authorize('specimen.collect'),
  asyncHandler((req, res) => SpecimenController.printBarcode(req, res))
);

router.post(
  '/specimens/:id/handoff',
  authorize('specimen.handoff'),
  asyncHandler((req, res) => SpecimenController.handoffSpecimen(req, res))
);

export const specimenRoutes = router;
