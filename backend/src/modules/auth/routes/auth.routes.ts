import { Router } from 'express';

import { validateRequest } from '../../../core/http/validate-request';
import { authorizeAndAudit } from '../../../middlewares/authorize-and-audit';
import { createSessionController, getMeController } from '../controllers/auth.controller';
import { createSessionSchema } from '../schemas/auth.schemas';

export const authRouter = Router();

authRouter.post('/sessions', validateRequest({ body: createSessionSchema }), createSessionController);
authRouter.get('/me', authorizeAndAudit(), getMeController);
