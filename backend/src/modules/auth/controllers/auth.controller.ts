import type { NextFunction, Request, Response } from 'express';

import { sendSuccess } from '../../../core/http/response';
import { AppError } from '../../../core/errors/app-error';
import { createSession, getCurrentPrincipal } from '../services/auth.service';
import type { CreateSessionBody } from '../schemas/auth.schemas';

/**
 * @route POST /api/v1/auth/sessions
 * @desc Log in with employee code + password, returns JWT + principal.
 * @access Public
 */
export async function createSessionController(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body as CreateSessionBody;
    const result = await createSession(username, password);
    sendSuccess(res, result, { status: 201 });
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/auth/me
 * @desc Return the identity/role of the currently authenticated principal.
 * @access Protected
 */
export async function getMeController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.principal) {
      throw AppError.unauthorized('UNAUTHENTICATED', 'Không xác thực được người dùng.');
    }
    const principal = await getCurrentPrincipal(req.principal.userId);
    sendSuccess(res, principal);
  } catch (error) {
    next(error);
  }
}
