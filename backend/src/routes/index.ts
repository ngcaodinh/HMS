import { Router } from 'express';

import { queueRouter } from '../modules/queue/routes/queue.routes';

/**
 * API v1 root router.
 */
export const apiV1Router = Router();

apiV1Router.use(queueRouter);
