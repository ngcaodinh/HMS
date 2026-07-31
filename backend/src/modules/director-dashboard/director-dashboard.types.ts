export type DirectorDashboardPeriod = 'today' | 'week' | 'month';

export interface DirectorDashboardQuery {
  date: string;
  period: DirectorDashboardPeriod;
}

export interface DirectorDateRange {
  date: string;
  end: Date;
  period: DirectorDashboardPeriod;
  start: Date;
}

export interface DirectorSummaryCard {
  detail?: string;
  label: string;
  tone: 'blue' | 'green' | 'red' | 'teal' | 'amber' | 'slate';
  value: string;
}

export interface DirectorNamedCount {
  count: number;
  label: string;
}

export interface DirectorProgressRow {
  label: string;
  value: number;
}

export interface DirectorTableRow {
  cells: string[];
}

export interface DirectorOverviewResponse {
  date: string;
  departmentRows: Array<{
    completed: number;
    departmentName: string;
    status: 'busy' | 'normal' | 'critical';
    statusLabel: string;
    total: number;
    waiting: number;
  }>;
  hourlyFlow: Array<{ hour: string; value: number }>;
  kpis: DirectorSummaryCard[];
  period: DirectorDashboardPeriod;
  queueMetrics: Array<{ label: string; value: string }>;
  queueServedRate: number;
}

export interface DirectorLabAnalyticsResponse {
  amrHeatmap: {
    antibiotics: string[];
    rows: Array<{ organism: string; values: string[] }>;
  };
  date: string;
  period: DirectorDashboardPeriod;
  resultByStatus: DirectorProgressRow[];
  summaryCards: DirectorSummaryCard[];
  topAbnormalIndicators: DirectorProgressRow[];
}

export interface DirectorFinanceInsuranceResponse {
  date: string;
  paymentBreakdown: DirectorNamedCount[];
  period: DirectorDashboardPeriod;
  reconciliationRows: DirectorTableRow[];
  summaryCards: DirectorSummaryCard[];
}

export interface DirectorBedPerformanceResponse {
  date: string;
  departmentRows: DirectorTableRow[];
  period: DirectorDashboardPeriod;
  statusBreakdown: DirectorNamedCount[];
  summaryCards: DirectorSummaryCard[];
}

export interface DirectorPharmacyInventoryResponse {
  alertCount: number;
  date: string;
  period: DirectorDashboardPeriod;
  rows: DirectorTableRow[];
  summaryCards: DirectorSummaryCard[];
}

export interface DirectorAuditSummaryResponse {
  actionRows: DirectorTableRow[];
  date: string;
  period: DirectorDashboardPeriod;
  resourceRows: DirectorTableRow[];
  roleRows: DirectorTableRow[];
  summaryCards: DirectorSummaryCard[];
}
