import { Router } from 'express';

import { asyncHandler } from '../../core/http/asyncHandler';
import { IdentityController } from './IdentityController';
import { identityService } from './identityComposition';
import { authenticate } from './identityMiddleware';
import { loginRateLimiter } from './loginRateLimiter';

const controller = new IdentityController(identityService);

export const identityRoutes = Router();

identityRoutes.post(
  '/auth/sessions',
  loginRateLimiter,
  asyncHandler((req, res) => controller.createSession(req, res)),
);
identityRoutes.get(
  '/auth/me',
  authenticate,
  asyncHandler((req, res) => controller.getCurrentPrincipal(req, res)),
);
identityRoutes.put(
  '/auth/password',
  authenticate,
  asyncHandler((req, res) => controller.changePassword(req, res)),
);
identityRoutes.get(
  '/staff-users',
  authenticate,
  asyncHandler((req, res) => controller.listStaffUsers(req, res)),
);
identityRoutes.post(
  '/staff-users',
  authenticate,
  asyncHandler((req, res) => controller.createStaffAccount(req, res)),
);
identityRoutes.patch(
  '/staff-users/:userId',
  authenticate,
  asyncHandler((req, res) => controller.updateStaffAccount(req, res)),
);
identityRoutes.post(
  '/staff-users/:userId/password-resets',
  authenticate,
  asyncHandler((req, res) => controller.resetStaffPassword(req, res)),
);
