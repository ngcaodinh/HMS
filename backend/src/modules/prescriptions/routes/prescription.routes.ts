import { Router } from 'express';

import { validateRequest } from '../../../core/http/validate-request';
import { authorizeAndAudit } from '../../../middlewares/authorize-and-audit';
import {
  cancelPrescriptionController,
  createPrescriptionDraftController,
  dispensePrescriptionController,
  downloadPrescriptionXmlController,
  exportPrescriptionXmlController,
  getLatestPrescriptionController,
  listDispensablePrescriptionsController,
  signPrescriptionController,
} from '../controllers/prescription.controller';
import { listDispensableMedicinesController } from '../controllers/medicine.controller';
import {
  cancelPrescriptionSchema,
  createPrescriptionDraftSchema,
  dispensePrescriptionSchema,
  exportPrescriptionXmlSchema,
  listDispensablePrescriptionsQuerySchema,
  medicineQuerySchema,
  prescriptionIdParamsSchema,
  recordIdParamsSchema,
  signPrescriptionSchema,
} from '../schemas/prescription.schemas';

/** Mounted at /api/v1/medical-records — owned by the prescriptions module (Lane 5), not medical-records (Lane 3). */
export const recordPrescriptionRouter = Router();

recordPrescriptionRouter.post(
  '/:recordId/prescriptions',
  authorizeAndAudit('prescription.create'),
  validateRequest({ params: recordIdParamsSchema, body: createPrescriptionDraftSchema }),
  createPrescriptionDraftController,
);

recordPrescriptionRouter.get(
  '/:recordId/prescriptions/latest',
  authorizeAndAudit('prescription.read'),
  validateRequest({ params: recordIdParamsSchema }),
  getLatestPrescriptionController,
);

/** Mounted at /api/v1/prescriptions */
export const prescriptionRouter = Router();

prescriptionRouter.get(
  '/',
  authorizeAndAudit('prescription.dispense.read'),
  validateRequest({ query: listDispensablePrescriptionsQuerySchema }),
  listDispensablePrescriptionsController,
);

prescriptionRouter.post(
  '/:prescriptionId/dispenses',
  authorizeAndAudit('prescription.dispense'),
  validateRequest({ params: prescriptionIdParamsSchema, body: dispensePrescriptionSchema }),
  dispensePrescriptionController,
);

prescriptionRouter.post(
  '/:prescriptionId/sign',
  authorizeAndAudit('prescription.sign'),
  validateRequest({ params: prescriptionIdParamsSchema, body: signPrescriptionSchema }),
  signPrescriptionController,
);

prescriptionRouter.post(
  '/:prescriptionId/cancel',
  authorizeAndAudit('prescription.cancel'),
  validateRequest({ params: prescriptionIdParamsSchema, body: cancelPrescriptionSchema }),
  cancelPrescriptionController,
);

prescriptionRouter.post(
  '/:prescriptionId/xml-exports',
  authorizeAndAudit('prescription.export'),
  validateRequest({ params: prescriptionIdParamsSchema, body: exportPrescriptionXmlSchema }),
  exportPrescriptionXmlController,
);

prescriptionRouter.get(
  '/:prescriptionId/xml-file',
  authorizeAndAudit('prescription.export'),
  validateRequest({ params: prescriptionIdParamsSchema }),
  downloadPrescriptionXmlController,
);

/** Mounted at /api/v1/medicines */
export const medicineRouter = Router();

medicineRouter.get(
  '/',
  authorizeAndAudit('medicine.read'),
  validateRequest({ query: medicineQuerySchema }),
  listDispensableMedicinesController,
);
