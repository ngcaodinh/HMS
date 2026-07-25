import { Router } from 'express';

import { authorizeAndAudit } from '../../../middlewares/authorize-and-audit';
import { listLabTestTypesController } from '../controllers/lab-test-type.controller';

export const labTestTypeRouter = Router();

labTestTypeRouter.get('/', authorizeAndAudit('catalog.lab_type.read'), listLabTestTypesController);
