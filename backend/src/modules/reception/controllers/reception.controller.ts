import type { NextFunction, Request, Response } from 'express';

import { sendSuccess } from '../../../core/http/response';
import { createEmergencyBodySchema } from '../schemas/emergency.schemas';
import { createReceptionBodySchema } from '../schemas/reception.schemas';
import { receptionService } from '../services/reception.service';

export class ReceptionController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = createReceptionBodySchema.parse(req.body);
      const data = await receptionService.createReception({
        ...body,
        actorUserId: req.principal?.userId,
      });
      sendSuccess(res, data, 201, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  async createEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = createEmergencyBodySchema.parse(req.body);
      const data = await receptionService.createEmergencyAdmission({
        ...body,
        actorUserId: req.principal?.userId,
      });
      sendSuccess(res, data, 201, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  async listDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctors = await receptionService.listDoctors();
      sendSuccess(res, doctors, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }
}

export const receptionController = new ReceptionController();
