import type { NextFunction, Request, Response } from 'express';

import { sendSuccess } from '../../../core/http/response';
import { normalizeEmergencyIdentityBodySchema } from '../../reception/schemas/emergency.schemas';
import { searchPatientsQuerySchema } from '../schemas/patient.schemas';
import { patientService } from '../services/patient.service';

export class PatientController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = searchPatientsQuerySchema.parse(req.query);
      const result = await patientService.search({
        fullName: query.fullName,
        phoneNumber: query.phoneNumber,
        identityCardNumber: query.identityCardNumber,
        page: query.page,
        pageSize: query.pageSize,
      });

      res.status(200).json({
        data: result.data,
        pagination: result.pagination,
        meta: { requestId: req.requestId },
      });
    } catch (error) {
      next(error);
    }
  }

  async normalizeEmergencyIdentity(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const patientId = String(req.params.patientId ?? '');
      const body = normalizeEmergencyIdentityBodySchema.parse(req.body);
      const data = await patientService.normalizeEmergencyIdentity(patientId, {
        ...body,
        actorUserId: req.principal?.userId,
      });
      sendSuccess(res, data, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }
}

export const patientController = new PatientController();
