import type { NextFunction, Request, Response } from 'express';

import { sendSuccess } from '../../../core/http/response';
import { listDispensableMedicines } from '../services/medicine.service';

/**
 * @route GET /api/v1/medicines
 * @access doctor, pharmacist
 */
export async function listDispensableMedicinesController(req: Request, res: Response, next: NextFunction) {
  try {
    const { keyword } = req.query as { keyword?: string };
    const result = await listDispensableMedicines(keyword);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
