import { z } from 'zod';

/** Các kỳ tổng hợp được backend hỗ trợ cho dashboard Director. */
const periodSchema = z.enum(['today', 'week', 'month']);

/** KPI dạng chuỗi hiển thị; `tone` chỉ quyết định màu cảnh báo, không phải trạng thái quyền. */
const summaryCardSchema = z.object({
  detail: z.string().optional(),
  label: z.string(),
  tone: z.enum(['blue', 'green', 'red', 'teal', 'amber', 'slate']),
  value: z.string(),
}).strict();

/** Nhãn và số lượng nguyên dùng cho các phân bổ aggregate, không chứa định danh cá nhân. */
const namedCountSchema = z.object({
  count: z.number(),
  label: z.string(),
}).strict();

/** Một tỷ lệ phần trăm aggregate; UI giới hạn bề rộng hiển thị trong khoảng 0–100. */
const progressRowSchema = z.object({
  label: z.string(),
  value: z.number(),
}).strict();

/** Một dòng bảng đã được backend chuyển thành chuỗi hiển thị, gồm cả tiền và trạng thái. */
const tableRowSchema = z.object({
  cells: z.array(z.string()),
}).strict();

/** Thông tin kỳ dữ liệu; `date` dùng định dạng lịch `YYYY-MM-DD` theo ngày pháp lý Việt Nam. */
const baseSectionSchema = z.object({
  date: z.string(),
  period: periodSchema,
}).strict();

/** Contract tổng quan điều hành: KPI, lưu lượng, hàng đợi và phân bổ theo khoa/phòng. */
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

/** Contract phân tích xét nghiệm aggregate, gồm tỷ lệ trạng thái và dữ liệu AMR đã redacted. */
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

/** Contract tổng hợp doanh thu/thanh toán và đối soát BHYT ở dạng read-only. */
export const directorFinanceInsuranceSchema = baseSectionSchema.extend({
  paymentBreakdown: z.array(namedCountSchema),
  reconciliationRows: z.array(tableRowSchema),
  summaryCards: z.array(summaryCardSchema),
}).strict();

/** Contract hiệu suất giường theo khoa/phòng, không chứa người bệnh đang nằm. */
export const directorBedPerformanceSchema = baseSectionSchema.extend({
  departmentRows: z.array(tableRowSchema),
  statusBreakdown: z.array(namedCountSchema),
  summaryCards: z.array(summaryCardSchema),
}).strict();

/** Contract cảnh báo tồn kho aggregate; `alertCount` là số cảnh báo để hiển thị trên điều hướng. */
export const directorPharmacyInventorySchema = baseSectionSchema.extend({
  alertCount: z.number(),
  rows: z.array(tableRowSchema),
  summaryCards: z.array(summaryCardSchema),
}).strict();

/** Contract thống kê audit theo nhóm action/resource/role, không phải log dòng chi tiết. */
export const directorAuditSummarySchema = baseSectionSchema.extend({
  actionRows: z.array(tableRowSchema),
  resourceRows: z.array(tableRowSchema),
  roleRows: z.array(tableRowSchema),
  summaryCards: z.array(summaryCardSchema),
}).strict();

/** Metadata kỹ thuật của envelope; `occurredAt` là thời điểm ISO nếu backend cung cấp. */
export const directorEnvelopeMetaSchema = z.object({
  occurredAt: z.string().optional(),
  requestId: z.string().optional(),
}).passthrough();

/** Tạo schema envelope để parse dữ liệu tại ranh giới mạng trước khi đưa vào UI. */
export const createDirectorEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  data: dataSchema,
  meta: directorEnvelopeMetaSchema.optional(),
}).strict();

/** Kỳ dữ liệu được phép truyền vào các query dashboard. */
export type DirectorDashboardPeriod = z.infer<typeof periodSchema>;

/** Dữ liệu tổng quan điều hành đã được parse và chỉ chứa số liệu aggregate. */
export type DirectorOverview = z.infer<typeof directorOverviewSchema>;

/** Dữ liệu phân tích xét nghiệm đã được parse ở network boundary. */
export type DirectorLabAnalytics = z.infer<typeof directorLabAnalyticsSchema>;

/** Dữ liệu tài chính/BHYT read-only đã được parse ở network boundary. */
export type DirectorFinanceInsurance = z.infer<typeof directorFinanceInsuranceSchema>;

/** Dữ liệu hiệu suất giường theo khoa/phòng đã được parse ở network boundary. */
export type DirectorBedPerformance = z.infer<typeof directorBedPerformanceSchema>;

/** Dữ liệu cảnh báo tồn kho aggregate đã được parse ở network boundary. */
export type DirectorPharmacyInventory = z.infer<typeof directorPharmacyInventorySchema>;

/** Dữ liệu thống kê audit aggregate đã được parse ở network boundary. */
export type DirectorAuditSummary = z.infer<typeof directorAuditSummarySchema>;

/** Envelope dữ liệu dùng chung giữa API adapter và các section dashboard. */
export type DirectorEnvelope<T> = {
  data: T;
  meta?: z.infer<typeof directorEnvelopeMetaSchema>;
};
