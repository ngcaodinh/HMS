import { z } from 'zod';

const periodSchema = z.enum(['today', 'week', 'month']);

const summaryCardSchema = z.object({
  detail: z.string().optional(),
  label: z.string(),
  tone: z.enum(['blue', 'green', 'red', 'teal', 'amber', 'slate']),
  value: z.string(),
}).strict();

const namedCountSchema = z.object({
  count: z.number(),
  label: z.string(),
}).strict();

const progressRowSchema = z.object({
  label: z.string(),
  value: z.number(),
}).strict();

const tableRowSchema = z.object({
  cells: z.array(z.string()),
}).strict();

const baseSectionSchema = z.object({
  date: z.string(),
  period: periodSchema,
}).strict();

export const directorOverviewSchema = baseSectionSchema.extend({
  departmentRows: z.array(z.object({
    completed: z.number(),
    departmentName: z.string(),
    status: z.enum(['busy', 'normal', 'critical']),
    statusLabel: z.string(),
    total: z.number(),
    waiting: z.number(),
  }).strict()),
  hourlyFlow: z.array(z.object({ hour: z.string(), value: z.number() }).strict()),
  kpis: z.array(summaryCardSchema),
  queueMetrics: z.array(z.object({ label: z.string(), value: z.string() }).strict()),
  queueServedRate: z.number(),
}).strict();

export const directorLabAnalyticsSchema = baseSectionSchema.extend({
  amrHeatmap: z.object({
    antibiotics: z.array(z.string()),
    rows: z.array(z.object({
      organism: z.string(),
      values: z.array(z.string()),
    }).strict()),
  }).strict(),
  resultByStatus: z.array(progressRowSchema),
  summaryCards: z.array(summaryCardSchema),
  topAbnormalIndicators: z.array(progressRowSchema),
}).strict();

export const directorFinanceInsuranceSchema = baseSectionSchema.extend({
  paymentBreakdown: z.array(namedCountSchema),
  reconciliationRows: z.array(tableRowSchema),
  summaryCards: z.array(summaryCardSchema),
}).strict();

export const directorBedPerformanceSchema = baseSectionSchema.extend({
  departmentRows: z.array(tableRowSchema),
  statusBreakdown: z.array(namedCountSchema),
  summaryCards: z.array(summaryCardSchema),
}).strict();

export const directorPharmacyInventorySchema = baseSectionSchema.extend({
  alertCount: z.number(),
  rows: z.array(tableRowSchema),
  summaryCards: z.array(summaryCardSchema),
}).strict();

export const directorAuditSummarySchema = baseSectionSchema.extend({
  actionRows: z.array(tableRowSchema),
  resourceRows: z.array(tableRowSchema),
  roleRows: z.array(tableRowSchema),
  summaryCards: z.array(summaryCardSchema),
}).strict();

export const directorEnvelopeMetaSchema = z.object({
  occurredAt: z.string().optional(),
  requestId: z.string().optional(),
}).passthrough();

export const createDirectorEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  data: dataSchema,
  meta: directorEnvelopeMetaSchema.optional(),
}).strict();

export type DirectorDashboardPeriod = z.infer<typeof periodSchema>;
export type DirectorOverview = z.infer<typeof directorOverviewSchema>;
export type DirectorLabAnalytics = z.infer<typeof directorLabAnalyticsSchema>;
export type DirectorFinanceInsurance = z.infer<typeof directorFinanceInsuranceSchema>;
export type DirectorBedPerformance = z.infer<typeof directorBedPerformanceSchema>;
export type DirectorPharmacyInventory = z.infer<typeof directorPharmacyInventorySchema>;
export type DirectorAuditSummary = z.infer<typeof directorAuditSummarySchema>;
export type DirectorEnvelope<T> = {
  data: T;
  meta?: z.infer<typeof directorEnvelopeMetaSchema>;
};
