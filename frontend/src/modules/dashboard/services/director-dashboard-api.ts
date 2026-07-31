import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import type { z } from 'zod';

import { apiGetEnvelope } from '@/shared/api-client';
import {
  createDirectorEnvelopeSchema,
  directorAuditSummarySchema,
  directorBedPerformanceSchema,
  directorFinanceInsuranceSchema,
  directorLabAnalyticsSchema,
  directorOverviewSchema,
  directorPharmacyInventorySchema,
  type DirectorAuditSummary,
  type DirectorBedPerformance,
  type DirectorDashboardPeriod,
  type DirectorEnvelope,
  type DirectorFinanceInsurance,
  type DirectorLabAnalytics,
  type DirectorOverview,
  type DirectorPharmacyInventory,
} from '../types/director-dashboard.schema';

export interface DirectorDashboardFilters {
  date?: string;
  period: DirectorDashboardPeriod;
}

const directorDashboardKeys = {
  all: ['director-dashboard'] as const,
  section: (section: string, filters: DirectorDashboardFilters) =>
    [...directorDashboardKeys.all, section, filters] as const,
};

const withParams = (filters: DirectorDashboardFilters, signal?: AbortSignal): AxiosRequestConfig => ({
  params: {
    date: filters.date,
    period: filters.period,
  },
  signal,
});

/**
 * Parse envelope tại network boundary để UI chỉ nhận dữ liệu Director đã đúng contract.
 */
async function getDirectorSection<T>(
  path: string,
  schema: z.ZodType<T>,
  filters: DirectorDashboardFilters,
  signal?: AbortSignal,
): Promise<DirectorEnvelope<T>> {
  const response = await apiGetEnvelope<unknown>(`/director-dashboard/${path}`, withParams(filters, signal));
  return createDirectorEnvelopeSchema(schema).parse(response) as DirectorEnvelope<T>;
}

export function useDirectorOverview(filters: DirectorDashboardFilters) {
  return useQuery({
    queryKey: directorDashboardKeys.section('overview', filters),
    queryFn: ({ signal }) =>
      getDirectorSection<DirectorOverview>('overview', directorOverviewSchema, filters, signal),
  });
}

export function useDirectorLabAnalytics(filters: DirectorDashboardFilters) {
  return useQuery({
    queryKey: directorDashboardKeys.section('lab-analytics', filters),
    queryFn: ({ signal }) =>
      getDirectorSection<DirectorLabAnalytics>('lab-analytics', directorLabAnalyticsSchema, filters, signal),
  });
}

export function useDirectorFinanceInsurance(filters: DirectorDashboardFilters) {
  return useQuery({
    queryKey: directorDashboardKeys.section('finance-insurance', filters),
    queryFn: ({ signal }) =>
      getDirectorSection<DirectorFinanceInsurance>(
        'finance-insurance',
        directorFinanceInsuranceSchema,
        filters,
        signal,
      ),
  });
}

export function useDirectorBedPerformance(filters: DirectorDashboardFilters) {
  return useQuery({
    queryKey: directorDashboardKeys.section('bed-performance', filters),
    queryFn: ({ signal }) =>
      getDirectorSection<DirectorBedPerformance>('bed-performance', directorBedPerformanceSchema, filters, signal),
  });
}

export function useDirectorPharmacyInventory(filters: DirectorDashboardFilters) {
  return useQuery({
    queryKey: directorDashboardKeys.section('pharmacy-inventory', filters),
    queryFn: ({ signal }) =>
      getDirectorSection<DirectorPharmacyInventory>(
        'pharmacy-inventory',
        directorPharmacyInventorySchema,
        filters,
        signal,
      ),
  });
}

export function useDirectorAuditSummary(filters: DirectorDashboardFilters) {
  return useQuery({
    queryKey: directorDashboardKeys.section('audit-summary', filters),
    queryFn: ({ signal }) =>
      getDirectorSection<DirectorAuditSummary>('audit-summary', directorAuditSummarySchema, filters, signal),
  });
}
