import { Router } from 'express';

import { validateRequest } from '../../../core/http/validate-request';
import { authorizeAndAudit } from '../../../middlewares/authorize-and-audit';
import { listLabTestTypesController } from '../controllers/lab-test-type.controller';
import { updateLabTestTypeReferenceRangeController } from '../controllers/lab-test.controller';
import { labTestTypeIdParamsSchema, updateReferenceRangeSchema } from '../schemas/lab-test.schemas';

/**
 * @route   /api/v1/lab-test-types
 * @desc    Liệt kê và quản lý khoảng tham chiếu loại xét nghiệm.
 * @access  Private, có audit và permission theo thao tác.
 */
export const labTestTypeRouter = Router();

labTestTypeRouter.get('/', authorizeAndAudit('catalog.lab_type.read'), listLabTestTypesController);

labTestTypeRouter.patch(
  '/:id/reference-range',
  authorizeAndAudit('catalog.lab_type.manage'),
  validateRequest({ params: labTestTypeIdParamsSchema, body: updateReferenceRangeSchema }),
  updateLabTestTypeReferenceRangeController,
);
