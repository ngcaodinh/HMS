import { Router } from 'express';

import { authorizeAndAudit } from '../../middlewares/authorize-and-audit';
import {
  getDirectorAuditSummaryController,
  getDirectorBedPerformanceController,
  getDirectorFinanceInsuranceController,
  getDirectorLabAnalyticsController,
  getDirectorOverviewController,
  getDirectorPharmacyInventoryController,
} from './director-dashboard.controller';
import { validateDirectorDashboardQuery } from './director-dashboard.schemas';

/**
 * @route   /api/v1/director-dashboard
 * @desc    Cung cấp các số liệu tổng hợp cho dashboard giám đốc.
 * @access  Private, yêu cầu director.dashboard.read và audit.
 */
export const directorDashboardRouter = Router();

const readDirectorDashboard = [
  authorizeAndAudit('director.dashboard.read'),
  validateDirectorDashboardQuery,
];

directorDashboardRouter.get('/overview', readDirectorDashboard, getDirectorOverviewController);
directorDashboardRouter.get('/lab-analytics', readDirectorDashboard, getDirectorLabAnalyticsController);
directorDashboardRouter.get('/finance-insurance', readDirectorDashboard, getDirectorFinanceInsuranceController);
directorDashboardRouter.get('/bed-performance', readDirectorDashboard, getDirectorBedPerformanceController);
directorDashboardRouter.get('/pharmacy-inventory', readDirectorDashboard, getDirectorPharmacyInventoryController);
directorDashboardRouter.get('/audit-summary', readDirectorDashboard, getDirectorAuditSummaryController);
