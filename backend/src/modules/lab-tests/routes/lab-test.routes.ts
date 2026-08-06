import { Router } from 'express';

import { validateRequest } from '../../../core/http/validate-request';
import { authorizeAndAudit } from '../../../middlewares/authorize-and-audit';
import {
  createReferenceRangeController,
  deleteReferenceRangeController,
  getLabActivityStatsController,
  getLabResultDetailController,
  listPendingLabTestsController,
  listReferenceRangesController,
  receiveSpecimenController,
  recordLabResultController,
  savePathologyWorkupDraftController,
  updateReferenceRangeController,
} from '../controllers/lab-test.controller';
import {
  createReferenceRangeSchema,
  labActivityStatsQuerySchema,
  labTestIdParamsSchema,
  listPendingLabTestsQuerySchema,
  listReferenceRangesQuerySchema,
  recordLabResultSchema,
  referenceRangeIdParamsSchema,
  savePathologyWorkupDraftSchema,
  updateReferenceRangeDetailSchema,
} from '../schemas/lab-test.schemas';

/**
 * @route   /api/v1/lab-tests/*
 * @desc    Tra cứu hàng đợi xét nghiệm, tiếp nhận mẫu, ghi kết quả và quản lý khoảng tham chiếu.
 * @access  Private (authorizeAndAudit với permission riêng theo từng endpoint)
 */
export const labTestRouter = Router();

// Đăng ký path tĩnh trước path động để Express không hiểu `reference-ranges` hoặc `stats` là labTestId.
labTestRouter.get(
  '/reference-ranges',
  authorizeAndAudit('catalog.lab_type.read'),
  validateRequest({ query: listReferenceRangesQuerySchema }),
  listReferenceRangesController,
);

labTestRouter.post(
  '/reference-ranges',
  authorizeAndAudit('catalog.lab_type.manage'),
  validateRequest({ body: createReferenceRangeSchema }),
  createReferenceRangeController,
);

labTestRouter.patch(
  '/reference-ranges/:referenceRangeId',
  authorizeAndAudit('catalog.lab_type.manage'),
  validateRequest({ params: referenceRangeIdParamsSchema, body: updateReferenceRangeDetailSchema }),
  updateReferenceRangeController,
);

labTestRouter.delete(
  '/reference-ranges/:referenceRangeId',
  authorizeAndAudit('catalog.lab_type.manage'),
  validateRequest({ params: referenceRangeIdParamsSchema }),
  deleteReferenceRangeController,
);

labTestRouter.get(
  '/stats',
  authorizeAndAudit('lab_test.stats.read'),
  validateRequest({ query: labActivityStatsQuerySchema }),
  getLabActivityStatsController,
);

labTestRouter.get(
  '/',
  authorizeAndAudit('lab_test.read_worklist'),
  validateRequest({ query: listPendingLabTestsQuerySchema }),
  listPendingLabTestsController,
);

labTestRouter.get(
  '/:labTestId',
  authorizeAndAudit('lab_test.read'),
  validateRequest({ params: labTestIdParamsSchema }),
  getLabResultDetailController,
);

labTestRouter.post(
  '/:labTestId/result',
  authorizeAndAudit('lab_test.result.write'),
  validateRequest({ params: labTestIdParamsSchema, body: recordLabResultSchema }),
  recordLabResultController,
);

labTestRouter.put(
  '/:labTestId/pathology-workup',
  authorizeAndAudit('lab_test.result.write'),
  validateRequest({ params: labTestIdParamsSchema, body: savePathologyWorkupDraftSchema }),
  savePathologyWorkupDraftController,
);

labTestRouter.post(
  '/:labTestId/receive-specimen',
  authorizeAndAudit('lab_test.result.write'),
  validateRequest({ params: labTestIdParamsSchema }),
  receiveSpecimenController,
);
