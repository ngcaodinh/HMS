import { Router } from 'express';

import { patientRouter } from '../modules/patients/routes/patient.routes';
import { queueRouter } from '../modules/queue/routes/queue.routes';
import { receptionRouter } from '../modules/reception/routes/reception.routes';

/**
 * API v1 root router.
 */
export const apiV1Router = Router();

apiV1Router.use(queueRouter);
apiV1Router.use(patientRouter);
apiV1Router.use(receptionRouter);
