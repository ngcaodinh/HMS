import type { NextFunction, Request, Response } from 'express';

import { sendSuccess } from '../../core/http/response';
import type { DirectorDashboardQuery } from './director-dashboard.types';
import {
  getDirectorAuditSummary,
  getDirectorBedPerformance,
  getDirectorFinanceInsurance,
  getDirectorLabAnalytics,
  getDirectorOverview,
  getDirectorPharmacyInventory,
} from './director-dashboard.service';

const getQuery = (req: Request) => req.query as unknown as DirectorDashboardQuery;

/**
 * @route GET /api/v1/director-dashboard/overview
 * @desc Trả tổng quan điều hành read-only đã redacted cho Giám đốc.
 * @access director
 */
export async function getDirectorOverviewController(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await getDirectorOverview(getQuery(req)));
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/director-dashboard/lab-analytics
 * @desc Trả phân tích xét nghiệm aggregate, không expose hồ sơ/bệnh nhân.
 * @access director
 */
export async function getDirectorLabAnalyticsController(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await getDirectorLabAnalytics(getQuery(req)));
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/director-dashboard/finance-insurance
 * @desc Trả tổng hợp tài chính và BHYT bằng số liệu aggregate.
 * @access director
 */
export async function getDirectorFinanceInsuranceController(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await getDirectorFinanceInsurance(getQuery(req)));
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/director-dashboard/bed-performance
 * @desc Trả hiệu suất giường bệnh theo khoa/phòng, không trả người bệnh đang nằm.
 * @access director
 */
export async function getDirectorBedPerformanceController(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await getDirectorBedPerformance(getQuery(req)));
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/director-dashboard/pharmacy-inventory
 * @desc Trả cảnh báo tồn kho dược phẩm từ dữ liệu batch thật.
 * @access director
 */
export async function getDirectorPharmacyInventoryController(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await getDirectorPharmacyInventory(getQuery(req)));
  } catch (error) {
    next(error);
  }
}

/**
 * @route GET /api/v1/director-dashboard/audit-summary
 * @desc Trả audit aggregate theo action/resource/role, không trả log chi tiết.
 * @access director
 */
export async function getDirectorAuditSummaryController(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await getDirectorAuditSummary(getQuery(req)));
  } catch (error) {
    next(error);
  }
}
