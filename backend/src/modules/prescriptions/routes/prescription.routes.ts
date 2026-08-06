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

/**
 * @route   GET|POST /api/v1/medical-records/:recordId/prescriptions[/*]
 * @desc    Tạo bản nháp và tra cứu đơn thuốc mới nhất của hồ sơ khám.
 * @access  Private (authorizeAndAudit với permission theo từng endpoint)
 */
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

/**
 * @route   GET|POST /api/v1/prescriptions/*
 * @desc    Tra cứu, ký, hủy, cấp phát và xuất dữ liệu đơn thuốc.
 * @access  Private (authorizeAndAudit với permission theo từng endpoint)
 */
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

/**
 * @route   GET /api/v1/medicines/
 * @desc    Tra cứu thuốc đủ điều kiện cấp phát theo bộ lọc tìm kiếm.
 * @access  Private (authorizeAndAudit với permission medicine.read)
 */
export const medicineRouter = Router();

medicineRouter.get(
  '/',
  authorizeAndAudit('medicine.read'),
  validateRequest({ query: medicineQuerySchema }),
  listDispensableMedicinesController,
);
