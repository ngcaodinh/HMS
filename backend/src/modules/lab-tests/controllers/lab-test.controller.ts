import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../core/errors/app-error';
import { sendSuccess } from '../../../core/http/response';
import { getLabResultDetail } from '../services/lab-test.service';

function requirePrincipal(req: Request) {
  if (!req.principal) throw AppError.unauthorized('UNAUTHENTICATED', 'Không xác thực được người dùng.');
  return req.principal;
}

/**
 * @route GET /api/v1/lab-tests/:labTestId
 * @access doctor, lab_tech
 */
export async function getLabResultDetailController(req: Request, res: Response, next: NextFunction) {
  try {
    requirePrincipal(req);
    const { labTestId } = req.params as { labTestId: string };
    const result = await getLabResultDetail(labTestId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
