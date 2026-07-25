import { Router } from 'express';

import { validateRequest } from '../../../core/http/validate-request';
import { authorizeAndAudit } from '../../../middlewares/authorize-and-audit';
import { getLabResultDetailController } from '../controllers/lab-test.controller';
import { labTestIdParamsSchema } from '../schemas/lab-test.schemas';

/** Mounted at /api/v1/lab-tests */
export const labTestRouter = Router();

labTestRouter.get(
  '/:labTestId',
  authorizeAndAudit('lab_test.read'),
  validateRequest({ params: labTestIdParamsSchema }),
  getLabResultDetailController,
);
