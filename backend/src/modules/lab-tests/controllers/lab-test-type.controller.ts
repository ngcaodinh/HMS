import type { NextFunction, Request, Response } from 'express';

import { sendSuccess } from '../../../core/http/response';
import { listLabTestTypes } from '../services/lab-test-type.service';

/**
 * @route GET /api/v1/lab-test-types
 * @access doctor, lab_tech, admin
 */
export async function listLabTestTypesController(req: Request, res: Response, next: NextFunction) {
  try {
    const { keyword } = req.query as { keyword?: string };
    const result = await listLabTestTypes(keyword);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
