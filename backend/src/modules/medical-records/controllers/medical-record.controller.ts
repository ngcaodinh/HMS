import type { NextFunction, Request, Response } from 'express';

import { sendPaginated, sendSuccess } from '../../../core/http/response';
import { AppError } from '../../../core/errors/app-error';
import {
  diagnoseMedicalRecord,
  orderLabTests,
  recordVitalSigns,
  updateClinicalAssessment,
} from '../services/medical-record-command.service';
import {
  getIcd10Catalog,
  getMedicalRecordDetail,
  listDoctorWorklist,
} from '../services/medical-record-query.service';

function requirePrincipal(req: Request) {
  if (!req.principal) throw AppError.unauthorized('UNAUTHENTICATED', 'Không xác thực được người dùng.');
  return req.principal;
}

/**
 * @route GET /api/v1/medical-records/worklist
 * @access doctor
 */
export async function listDoctorWorklistController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { status, date, page, pageSize } = req.query as unknown as {
      status?: 'open' | 'waiting_results' | 'diagnosed' | 'closed';
      date?: string;
      page: number;
      pageSize: number;
    };
    const result = await listDoctorWorklist(principal.userId, { status, date, page, pageSize });
    sendPaginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/medical-records/:recordId
 * @access doctor
 */
export async function getMedicalRecordDetailController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { recordId } = req.params as { recordId: string };
    const result = await getMedicalRecordDetail(recordId, principal);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/clinical-catalogs/icd-10
 * @access doctor
 */
export async function getIcd10CatalogController(req: Request, res: Response, next: NextFunction) {
  try {
    const { keyword } = req.query as { keyword?: string };
    const result = getIcd10Catalog(keyword);
    sendSuccess(res, result.data);
  } catch (error) {
    next(error);
  }
}

/**
 * @route POST /api/v1/medical-records/:recordId/vital-signs
 * @access doctor, nurse
 */
export async function recordVitalSignsController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { recordId } = req.params as { recordId: string };
    const result = await recordVitalSigns(recordId, principal.userId, req.body);
    sendSuccess(res, result, { status: 201 });
  } catch (error) {
    next(error);
  }
}

/**
 * @route PATCH /api/v1/medical-records/:recordId/clinical-assessment
 * @access doctor
 */
export async function updateClinicalAssessmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { recordId } = req.params as { recordId: string };
    const result = await updateClinicalAssessment(recordId, principal.userId, req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @route POST /api/v1/medical-records/:recordId/lab-tests
 * @access doctor
 */
export async function orderLabTestsController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { recordId } = req.params as { recordId: string };
    const result = await orderLabTests(recordId, principal.userId, req.body);
    sendSuccess(res, result, { status: 201 });
  } catch (error) {
    next(error);
  }
}

/**
 * @route POST /api/v1/medical-records/:recordId/diagnosis
 * @access doctor
 */
export async function diagnoseMedicalRecordController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { recordId } = req.params as { recordId: string };
    const result = await diagnoseMedicalRecord(recordId, principal.userId, req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
