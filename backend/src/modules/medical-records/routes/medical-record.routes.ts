import { Router } from 'express';

import { validateRequest } from '../../../core/http/validate-request';
import { authorizeAndAudit } from '../../../middlewares/authorize-and-audit';
import {
  diagnoseMedicalRecordController,
  getIcd10CatalogController,
  getMedicalRecordDetailController,
  listDoctorWorklistController,
  orderLabTestsController,
  recordVitalSignsController,
  recordVitalSignsAndAssessmentController,
  updateClinicalAssessmentController,
} from '../controllers/medical-record.controller';
import {
  diagnoseRecordSchema,
  icd10QuerySchema,
  orderLabTestsSchema,
  recordIdParamsSchema,
  recordVitalSignsSchema,
  recordVitalSignsWithAssessmentSchema,
  updateClinicalAssessmentSchema,
  worklistQuerySchema,
} from '../schemas/medical-record.schemas';

export const medicalRecordRouter = Router();
export const clinicalCatalogRouter = Router();

medicalRecordRouter.get(
  '/worklist',
  authorizeAndAudit('medical_record.worklist.read'),
  validateRequest({ query: worklistQuerySchema }),
  listDoctorWorklistController,
);

medicalRecordRouter.get(
  '/:recordId',
  authorizeAndAudit('medical_record.read'),
  validateRequest({ params: recordIdParamsSchema }),
  getMedicalRecordDetailController,
);

medicalRecordRouter.post(
  '/:recordId/vital-signs',
  authorizeAndAudit('vital_sign.write'),
  validateRequest({ params: recordIdParamsSchema, body: recordVitalSignsSchema }),
  recordVitalSignsController,
);

medicalRecordRouter.post(
  '/:recordId/vital-signs-with-assessment',
  authorizeAndAudit('clinical_assessment.write'),
  validateRequest({ params: recordIdParamsSchema, body: recordVitalSignsWithAssessmentSchema }),
  recordVitalSignsAndAssessmentController,
);

medicalRecordRouter.patch(
  '/:recordId/clinical-assessment',
  authorizeAndAudit('clinical_assessment.write'),
  validateRequest({ params: recordIdParamsSchema, body: updateClinicalAssessmentSchema }),
  updateClinicalAssessmentController,
);

medicalRecordRouter.post(
  '/:recordId/lab-tests',
  authorizeAndAudit('lab_test.order.write'),
  validateRequest({ params: recordIdParamsSchema, body: orderLabTestsSchema }),
  orderLabTestsController,
);

medicalRecordRouter.post(
  '/:recordId/diagnosis',
  authorizeAndAudit('diagnosis.write'),
  validateRequest({ params: recordIdParamsSchema, body: diagnoseRecordSchema }),
  diagnoseMedicalRecordController,
);

clinicalCatalogRouter.get(
  '/icd-10',
  authorizeAndAudit('icd10.read'),
  validateRequest({ query: icd10QuerySchema }),
  getIcd10CatalogController,
);
