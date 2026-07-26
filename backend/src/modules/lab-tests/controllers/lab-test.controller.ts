import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../core/errors/app-error';
import { sendPaginated, sendSuccess } from '../../../core/http/response';
import {
  createNewReferenceRange,
  deleteReferenceRangeById,
  getLabActivityStats,
  getLabResultDetail,
  listPendingLabTests,
  listReferenceRangesForConfig,
  manageLabTestTypeReferenceRange,
  receiveSpecimen,
  recordLabResult,
  savePathologyWorkupDraft,
  updateReferenceRangeById,
} from '../services/lab-test.service';
import type {
  CreateReferenceRangeInput,
  LabActivityStatsQuery,
  ListPendingLabTestsQuery,
  ListReferenceRangesQuery,
  RecordLabResultInput,
  SavePathologyWorkupDraftInput,
  UpdateReferenceRangeDetailInput,
} from '../types/lab-test.types';

function requirePrincipal(req: Request) {
  if (!req.principal) throw AppError.unauthorized('UNAUTHENTICATED', 'Không xác thực được người dùng.');
  return req.principal;
}

/**
 * @route GET /api/v1/lab-tests
 * @access lab_tech
 */
export async function listPendingLabTestsController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const query = req.query as unknown as ListPendingLabTestsQuery;
    const result = await listPendingLabTests(query, principal);
    sendPaginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/lab-tests/:labTestId
 * @access doctor, lab_tech
 */
export async function getLabResultDetailController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { labTestId } = req.params as { labTestId: string };
    const result = await getLabResultDetail(labTestId, principal);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @route POST /api/v1/lab-tests/:labTestId/result
 * @access lab_tech
 */
export async function recordLabResultController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { labTestId } = req.params as { labTestId: string };
    const input = req.body as RecordLabResultInput;
    const result = await recordLabResult(labTestId, input, principal);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @route PUT /api/v1/lab-tests/:labTestId/pathology-workup
 * @access lab_tech
 */
export async function savePathologyWorkupDraftController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { labTestId } = req.params as { labTestId: string };
    const input = req.body as SavePathologyWorkupDraftInput;
    const result = await savePathologyWorkupDraft(labTestId, input, principal);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @route PATCH /api/v1/lab-test-types/:id/reference-range
 * @access lab_tech, admin
 */
export async function updateLabTestTypeReferenceRangeController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { id } = req.params as { id: string };
    const { referenceRange } = req.body as { referenceRange: string };
    const result = await manageLabTestTypeReferenceRange(id, referenceRange, principal);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @route POST /api/v1/lab-tests/:labTestId/receive-specimen
 * @access lab_tech
 */
export async function receiveSpecimenController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { labTestId } = req.params as { labTestId: string };
    const result = await receiveSpecimen(labTestId, principal);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/lab-tests/reference-ranges
 * @access lab_tech, admin
 */
export async function listReferenceRangesController(req: Request, res: Response, next: NextFunction) {
  try {
    requirePrincipal(req);
    const query = req.query as unknown as ListReferenceRangesQuery;
    const result = await listReferenceRangesForConfig(query);
    sendPaginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * @route POST /api/v1/lab-tests/reference-ranges
 * @access lab_tech, admin
 */
export async function createReferenceRangeController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const input = req.body as CreateReferenceRangeInput;
    const result = await createNewReferenceRange(input, principal);
    sendSuccess(res, result, { status: 201 });
  } catch (error) {
    next(error);
  }
}

/**
 * @route PATCH /api/v1/lab-tests/reference-ranges/:referenceRangeId
 * @access lab_tech, admin
 */
export async function updateReferenceRangeController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { referenceRangeId } = req.params as { referenceRangeId: string };
    const input = req.body as UpdateReferenceRangeDetailInput;
    const result = await updateReferenceRangeById(referenceRangeId, input, principal);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @route DELETE /api/v1/lab-tests/reference-ranges/:referenceRangeId
 * @access lab_tech, admin
 */
export async function deleteReferenceRangeController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { referenceRangeId } = req.params as { referenceRangeId: string };
    const result = await deleteReferenceRangeById(referenceRangeId, principal);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/lab-tests/stats
 * @access lab_tech
 */
export async function getLabActivityStatsController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const query = req.query as unknown as LabActivityStatsQuery;
    const result = await getLabActivityStats(query, principal);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
