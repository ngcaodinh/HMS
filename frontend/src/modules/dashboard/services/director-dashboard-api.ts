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

/** Bộ lọc dùng chung cho các endpoint aggregate của dashboard Director. */
export interface DirectorDashboardFilters {
  /** Ngày pháp lý dạng `YYYY-MM-DD`; bỏ trống để backend dùng ngày hiện tại. */
  date?: string;
  /** Kỳ tổng hợp được backend chấp nhận: hôm nay, 7 ngày hoặc tháng. */
  period: DirectorDashboardPeriod;
}

/** Key React Query tách riêng từng section và kỳ để cache không trộn dữ liệu. */
const directorDashboardKeys = {
  all: ['director-dashboard'] as const,
  section: (section: string, filters: DirectorDashboardFilters) =>
    [...directorDashboardKeys.all, section, filters] as const,
};

/** Tạo query và AbortSignal cho request GET dashboard; không có request body. */
const withParams = (filters: DirectorDashboardFilters, signal?: AbortSignal): AxiosRequestConfig => ({
  params: {
    date: filters.date,
    period: filters.period,
  },
  signal,
});

/**
 * Gọi một section dashboard và parse envelope tại network boundary.
 * @param path Phần đường dẫn sau `/director-dashboard/`.
 * @param schema Schema Zod tương ứng với payload của section.
 * @param filters Query `date` và `period` gửi bằng GET.
 * @param signal Tín hiệu hủy request khi React Query loại bỏ lần fetch cũ.
 * @returns Envelope đã chuẩn hóa để UI chỉ nhận dữ liệu đúng contract.
 * @throws Lỗi HTTP hoặc lỗi Zod; React Query chuyển lỗi này thành trạng thái error của section.
 * @remarks Backend yêu cầu quyền `director.dashboard.read`, ghi audit và trả dữ liệu aggregate/
 * redacted; UI không dùng adapter này để thay thế authorization.
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

/**
 * Gọi GET `/director-dashboard/overview` để lấy tổng quan điều hành read-only gồm KPI, hàng đợi và
 * phân bổ theo khoa/phòng.
 * @param filters Kỳ và ngày dùng để tạo query key/cache và query string.
 * @returns Trạng thái React Query; `data` là envelope đã parse, còn loading/error/empty do UI xử lý.
 * @remarks Cache được tách theo section và filters, dùng chính sách retry mặc định của React Query;
 * request có thể bị hủy qua AbortSignal khi filters thay đổi.
 */
export function useDirectorOverview(filters: DirectorDashboardFilters) {
  return useQuery({
    queryKey: directorDashboardKeys.section('overview', filters),
    queryFn: ({ signal }) =>
      getDirectorSection<DirectorOverview>('overview', directorOverviewSchema, filters, signal),
  });
}

/**
 * Gọi GET `/director-dashboard/lab-analytics` để lấy phân tích xét nghiệm aggregate, gồm tỷ lệ trạng
 * thái và AMR đã redacted.
 * @param filters Kỳ và ngày dùng để tạo query key/cache và query string.
 * @returns Trạng thái React Query với dữ liệu đã được parse tại network boundary.
 * @remarks Không trả hồ sơ hay định danh người bệnh; quyền truy cập vẫn do backend kiểm tra.
 * Cache/retry dùng cấu hình mặc định, còn request cũ được hủy qua AbortSignal.
 */
export function useDirectorLabAnalytics(filters: DirectorDashboardFilters) {
  return useQuery({
    queryKey: directorDashboardKeys.section('lab-analytics', filters),
    queryFn: ({ signal }) =>
      getDirectorSection<DirectorLabAnalytics>('lab-analytics', directorLabAnalyticsSchema, filters, signal),
  });
}

/**
 * Gọi GET `/director-dashboard/finance-insurance` để lấy tổng hợp tài chính và BHYT ở dạng read-only.
 * @param filters Kỳ và ngày gửi dưới dạng query của request GET.
 * @returns Trạng thái React Query với envelope tài chính đã parse; lỗi API/contract được expose qua error.
 * @remarks Frontend chỉ hiển thị giá trị aggregate do backend trả về, không tự tính hay sửa số tiền;
 * cache/retry dùng mặc định và request có thể bị hủy khi filters thay đổi.
 */
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

/**
 * Gọi GET `/director-dashboard/bed-performance` để lấy hiệu suất giường theo khoa/phòng ở dạng aggregate.
 * @param filters Kỳ và ngày dùng cho query string và cache key.
 * @returns Trạng thái React Query với dữ liệu đã parse hoặc lỗi để boundary hiển thị.
 * @remarks API không trả danh sách người bệnh; backend vẫn là nguồn quyết định quyền đọc.
 * React Query dùng cache/retry mặc định và chuyển AbortSignal cho request.
 */
export function useDirectorBedPerformance(filters: DirectorDashboardFilters) {
  return useQuery({
    queryKey: directorDashboardKeys.section('bed-performance', filters),
    queryFn: ({ signal }) =>
      getDirectorSection<DirectorBedPerformance>('bed-performance', directorBedPerformanceSchema, filters, signal),
  });
}

/**
 * Gọi GET `/director-dashboard/pharmacy-inventory` để lấy cảnh báo tồn kho aggregate cho KPI và badge
 * điều hướng.
 * @param filters Kỳ và ngày dùng cho query string và cache key.
 * @returns Trạng thái React Query với `alertCount` và các dòng tồn kho đã parse.
 * @remarks Đây là dữ liệu read-only từ backend; cache/retry dùng mặc định, request cũ được hủy qua
 * AbortSignal khi filters thay đổi.
 */
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

/**
 * Gọi GET `/director-dashboard/audit-summary` để lấy thống kê audit aggregate theo action/resource/role.
 * @param filters Kỳ và ngày dùng cho query string và cache key.
 * @returns Trạng thái React Query với số liệu audit đã parse, không phải log chi tiết.
 * @remarks Endpoint yêu cầu quyền Director và audit ở backend; UI chỉ hiển thị aggregate. Cache/retry
 * dùng mặc định và AbortSignal hỗ trợ hủy request cũ.
 */
export function useDirectorAuditSummary(filters: DirectorDashboardFilters) {
  return useQuery({
    queryKey: directorDashboardKeys.section('audit-summary', filters),
    queryFn: ({ signal }) =>
      getDirectorSection<DirectorAuditSummary>('audit-summary', directorAuditSummarySchema, filters, signal),
  });
}
