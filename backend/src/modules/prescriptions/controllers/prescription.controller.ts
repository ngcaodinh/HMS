import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../core/errors/app-error';
import { sendPaginated, sendSuccess } from '../../../core/http/response';
import {
  cancelPrescription,
  createPrescriptionDraft,
  dispensePrescription,
  downloadPrescriptionXml,
  exportPrescriptionXml,
  getLatestPrescriptionForRecord,
  listDispensablePrescriptions,
  signPrescription,
} from '../services/prescription.service';
import { idempotencyKeySchema } from '../schemas/prescription.schemas';

function requirePrincipal(req: Request) {
  if (!req.principal) throw AppError.unauthorized('UNAUTHENTICATED', 'Không xác thực được người dùng.');
  return req.principal;
}

/**
 * @route POST /api/v1/medical-records/:recordId/prescriptions
 * @access doctor
 */
export async function createPrescriptionDraftController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { recordId } = req.params as { recordId: string };
    const result = await createPrescriptionDraft(recordId, principal.userId, req.body);
    sendSuccess(res, result, { status: 201 });
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/medical-records/:recordId/prescriptions/latest
 * @access doctor
 */
export async function getLatestPrescriptionController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { recordId } = req.params as { recordId: string };
    const result = await getLatestPrescriptionForRecord(recordId, principal.userId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @route POST /api/v1/prescriptions/:prescriptionId/sign
 * @access doctor
 */
export async function signPrescriptionController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { prescriptionId } = req.params as { prescriptionId: string };
    const result = await signPrescription(prescriptionId, principal.userId, req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @route POST /api/v1/prescriptions/:prescriptionId/cancel
 * @access doctor, pharmacist, admin
 */
export async function cancelPrescriptionController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { prescriptionId } = req.params as { prescriptionId: string };
    const result = await cancelPrescription(prescriptionId, principal, req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * @route POST /api/v1/prescriptions/:prescriptionId/xml-exports
 * @access doctor, pharmacist, admin
 */
export async function exportPrescriptionXmlController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { prescriptionId } = req.params as { prescriptionId: string };
    const { expectedVersion } = req.body as { expectedVersion: number };
    const result = await exportPrescriptionXml(prescriptionId, principal, expectedVersion);
    sendSuccess(res, result, { status: 201 });
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/prescriptions/:prescriptionId/xml-file
 * @desc Binary download — returns raw XML, not the JSON envelope.
 * @access doctor, pharmacist, admin
 */
export async function downloadPrescriptionXmlController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { prescriptionId } = req.params as { prescriptionId: string };
    const { content, fileName } = await downloadPrescriptionXml(prescriptionId, principal);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.status(200).send(content);
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/prescriptions
 * @access pharmacist, admin
 */
export async function listDispensablePrescriptionsController(req: Request, res: Response, next: NextFunction) {
  try {
    requirePrincipal(req);
    const { keyword, dispensed, page, pageSize, warehouseId } = req.query as unknown as {
      keyword?: string;
      dispensed: boolean;
      page: number;
      pageSize: number;
      warehouseId?: string;
    };
    const result = await listDispensablePrescriptions({ keyword, dispensed, page, pageSize, warehouseId });
    sendPaginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * @route POST /api/v1/prescriptions/:prescriptionId/dispenses
 * @access pharmacist, admin
 */
export async function dispensePrescriptionController(req: Request, res: Response, next: NextFunction) {
  try {
    const principal = requirePrincipal(req);
    const { prescriptionId } = req.params as { prescriptionId: string };
    const { expectedVersion } = req.body as { expectedVersion: number };
    const keyParsed = idempotencyKeySchema.safeParse(req.header('idempotency-key'));
    if (!keyParsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Header Idempotency-Key (UUID) là bắt buộc', [
        { field: 'Idempotency-Key', rule: 'uuid' },
      ]);
    }
    const result = await dispensePrescription(prescriptionId, principal.userId, expectedVersion, keyParsed.data);
    sendSuccess(res, result, { status: 201 });
  } catch (error) {
    next(error);
  }
}
