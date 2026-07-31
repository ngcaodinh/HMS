import type {
  DirectorAuditSummaryResponse,
  DirectorBedPerformanceResponse,
  DirectorDashboardQuery,
  DirectorDateRange,
  DirectorFinanceInsuranceResponse,
  DirectorLabAnalyticsResponse,
  DirectorOverviewResponse,
  DirectorPharmacyInventoryResponse,
  DirectorProgressRow,
  DirectorSummaryCard,
} from './director-dashboard.types';
import {
  directorDashboardRepositoryInternals,
  getDirectorAuditStats,
  getDirectorBedStats,
  getDirectorFinanceStats,
  getDirectorInventoryStats,
  getDirectorLabStats,
  getDirectorOverviewStats,
} from './director-dashboard.repository';

const { bioChemistryIndicators, percentage, selectedAntibiotics, toNumber } =
  directorDashboardRepositoryInternals;

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const parseDateOnly = (date: string) => {
  const [yearRaw, monthRaw, dayRaw] = date.split('-');
  return new Date(Date.UTC(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw)));
};

const formatDecimalLabel = (amount: string) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value === 0) return '0';
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (value >= 1_000) return `${Math.round(value / 1000)}K`;
  return `${Math.round(value)}`;
};

const statusLabelMap: Record<string, string> = {
  called: 'Đã gọi',
  cancelled: 'Đã hủy',
  closed: 'Đã đóng',
  diagnosed: 'Đã chẩn đoán',
  failed: 'Thất bại',
  in_progress: 'Đang xử lý',
  ordered: 'Đã chỉ định',
  paid: 'Đã thanh toán',
  pending: 'Chờ xử lý',
  resulted: 'Đã có kết quả',
  served: 'Đã phục vụ',
  skipped: 'Bỏ qua',
  waiting: 'Đang chờ',
  waiting_results: 'Chờ kết quả',
  write_off: 'Miễn giảm',
};

const categoryLabelMap: Record<string, string> = {
  bed: 'Giường bệnh',
  consultation: 'Khám bệnh',
  lab: 'Cận lâm sàng',
  medicine: 'Thuốc',
  other: 'Khác',
  procedure: 'Thủ thuật',
};

const normalizeLabel = (value: string) => statusLabelMap[value] ?? categoryLabelMap[value] ?? value;

/**
 * Tạo khoảng thời gian theo ngày pháp lý VN cho các endpoint Director.
 */
function buildDateRange(query: DirectorDashboardQuery): DirectorDateRange {
  const selectedDate = parseDateOnly(query.date);

  if (query.period === 'week') {
    return {
      date: query.date,
      end: addDays(selectedDate, 1),
      period: query.period,
      start: addDays(selectedDate, -6),
    };
  }

  if (query.period === 'month') {
    const start = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 1));
    const end = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth() + 1, 1));
    return { date: query.date, end, period: query.period, start };
  }

  return {
    date: query.date,
    end: addDays(selectedDate, 1),
    period: query.period,
    start: selectedDate,
  };
}

const emptyCard = (label: string, tone: DirectorSummaryCard['tone'] = 'slate'): DirectorSummaryCard => ({
  label,
  tone,
  value: '0',
});

/**
 * Lấy tổng quan điều hành read-only cho Giám đốc, không có drill-down bệnh nhân.
 */
export async function getDirectorOverview(query: DirectorDashboardQuery): Promise<DirectorOverviewResponse> {
  const range = buildDateRange(query);
  const stats = await getDirectorOverviewStats(range);
  const departmentMap = new Map<
    string,
    { completed: number; departmentName: string; total: number; waiting: number }
  >();

  for (const group of stats.departmentGroups) {
    const key = group.departmentId ?? 'unassigned';
    const current = departmentMap.get(key) ?? {
      completed: 0,
      departmentName: group.departmentName,
      total: 0,
      waiting: 0,
    };
    current.total += group.count;
    if (['closed', 'diagnosed'].includes(group.status)) current.completed += group.count;
    if (['open', 'waiting_results'].includes(group.status)) current.waiting += group.count;
    departmentMap.set(key, current);
  }

  const hourlyCounts = new Map<string, number>();
  for (const record of stats.hourlyRecords) {
    const hour = `${record.createdAt.getHours()}h`;
    hourlyCounts.set(hour, (hourlyCounts.get(hour) ?? 0) + 1);
  }

  return {
    date: range.date,
    departmentRows: Array.from(departmentMap.values()).map((row) => {
      const busyRate = percentage(row.waiting, Math.max(row.total, 1));
      const status = busyRate >= 40 ? 'busy' : 'normal';
      return {
        ...row,
        status,
        statusLabel: status === 'busy' ? 'Đông' : 'Bình thường',
      };
    }),
    hourlyFlow: Array.from(hourlyCounts.entries()).map(([hour, value]) => ({ hour, value })),
    kpis: [
      {
        detail: `${stats.queue.served} lượt đã phục vụ`,
        label: 'Lượt khám & tiếp đón',
        tone: 'blue',
        value: String(stats.visits),
      },
      {
        detail: `${stats.beds.occupied} / ${stats.beds.total} giường đang sử dụng`,
        label: 'Công suất giường bệnh',
        tone: 'teal',
        value: `${stats.beds.utilizationRate}%`,
      },
      {
        detail: `${stats.paidInvoiceCount} hóa đơn đã thanh toán`,
        label: 'Doanh thu thực thu',
        tone: 'green',
        value: formatDecimalLabel(stats.revenueAmount),
      },
      {
        detail: `${stats.emergencyBypassCount} bypass hành chính`,
        label: 'Ca cấp cứu / bypass',
        tone: stats.emergencyBypassCount > 0 ? 'red' : 'slate',
        value: String(stats.emergencyRecordCount + stats.emergencyBypassCount),
      },
    ],
    period: range.period,
    queueMetrics: [
      { label: 'Đang chờ', value: String(stats.queue.waiting) },
      { label: 'Đã gọi', value: String(stats.queue.called) },
      { label: 'Đã phục vụ', value: String(stats.queue.served) },
      { label: 'Tỷ lệ phục vụ', value: `${stats.queue.servedRate}%` },
    ],
    queueServedRate: stats.queue.servedRate,
  };
}

/**
 * Lấy phân tích xét nghiệm aggregate, gồm trạng thái, chỉ số bất thường và AMR redacted.
 */
export async function getDirectorLabAnalytics(
  query: DirectorDashboardQuery,
): Promise<DirectorLabAnalyticsResponse> {
  const range = buildDateRange(query);
  const stats = await getDirectorLabStats(range);
  const abnormalRows = bioChemistryIndicators.map((indicator) => {
    const abnormalCount = stats.bioChemistryRows.filter((row) => {
      const value = toNumber(row[indicator.field]);
      return value > 0 && (value < indicator.min || value > indicator.max);
    }).length;
    return {
      label: indicator.label,
      value: percentage(abnormalCount, stats.bioChemistryRows.length),
    };
  }).filter((row) => row.value > 0);

  const amrRows = stats.microbiologyRows.map((row) => ({
    organism: row.chungVkKsd || 'Không xác định',
    values: selectedAntibiotics.map((antibiotic) => row[antibiotic.field] || '-'),
  }));

  return {
    amrHeatmap: {
      antibiotics: stats.antibiotics,
      rows: amrRows,
    },
    date: range.date,
    period: range.period,
    resultByStatus: stats.statusGroups.map((group) => ({
      label: normalizeLabel(group.label),
      value: percentage(group.count, stats.total),
    })),
    summaryCards: [
      { label: 'Tổng chỉ định CLS', tone: 'blue', value: String(stats.total) },
      { label: 'Đã có kết quả', tone: 'green', value: String(stats.resulted) },
      { label: 'Chờ kết quả', tone: 'amber', value: String(stats.pending) },
      { label: 'Chỉ định khẩn', tone: 'red', value: String(stats.urgent) },
    ],
    topAbnormalIndicators: abnormalRows,
  };
}

/**
 * Lấy tài chính/BHYT aggregate, tiền trả dạng chuỗi để frontend không tính float.
 */
export async function getDirectorFinanceInsurance(
  query: DirectorDashboardQuery,
): Promise<DirectorFinanceInsuranceResponse> {
  const range = buildDateRange(query);
  const stats = await getDirectorFinanceStats(range);

  return {
    date: range.date,
    paymentBreakdown: [
      { count: Number(stats.cashAmount), label: 'cash' },
      { count: Number(stats.momoAmount), label: 'momo' },
    ],
    period: range.period,
    reconciliationRows: [
      ...stats.itemGroups.map((group) => ({
        cells: [normalizeLabel(group.label), `${group.count} dòng`, group.amount, 'Đã ghi nhận'],
      })),
      ...stats.claimGroups.map((group) => ({
        cells: ['BHYT', `${group.count} hồ sơ`, normalizeLabel(group.label), 'Tổng hợp'],
      })),
    ],
    summaryCards: [
      { label: 'Tổng viện phí', tone: 'green', value: stats.totalAmount },
      { label: 'Thực thu', tone: 'blue', value: stats.paidAmount },
      { label: 'Tiền mặt', tone: 'teal', value: stats.cashAmount },
      { label: 'BHYT giảm trừ', tone: 'amber', value: stats.healthInsuranceDiscountAmount },
    ],
  };
}

/**
 * Lấy hiệu suất giường bệnh aggregate theo khoa/phòng, không expose người bệnh.
 */
export async function getDirectorBedPerformance(
  query: DirectorDashboardQuery,
): Promise<DirectorBedPerformanceResponse> {
  const range = buildDateRange(query);
  const stats = await getDirectorBedStats();
  const totalBeds = stats.beds.length;
  const occupiedBeds = stats.beds.filter((bed) => bed.status === 'occupied').length;
  const availableBeds = stats.beds.filter((bed) => bed.status === 'available').length;
  const maintenanceBeds = stats.beds.filter((bed) => bed.status === 'maintenance').length;
  const byDepartment = new Map<string, { available: number; maintenance: number; occupied: number; total: number }>();

  for (const bed of stats.beds) {
    const departmentName = bed.room.department?.name ?? bed.room.name ?? 'Chưa phân khoa';
    const current = byDepartment.get(departmentName) ?? {
      available: 0,
      maintenance: 0,
      occupied: 0,
      total: 0,
    };
    current.total += 1;
    if (bed.status === 'available') current.available += 1;
    if (bed.status === 'maintenance') current.maintenance += 1;
    if (bed.status === 'occupied') current.occupied += 1;
    byDepartment.set(departmentName, current);
  }

  return {
    date: range.date,
    departmentRows: Array.from(byDepartment.entries()).map(([departmentName, row]) => ({
      cells: [
        departmentName,
        `${row.occupied} / ${row.total}`,
        `${percentage(row.occupied, row.total)}%`,
        row.available > 0 ? 'Còn trống' : 'Theo dõi tải',
      ],
    })),
    period: range.period,
    statusBreakdown: [
      { count: occupiedBeds, label: 'occupied' },
      { count: availableBeds, label: 'available' },
      { count: maintenanceBeds, label: 'maintenance' },
    ],
    summaryCards: [
      { label: 'Công suất chung', tone: 'teal', value: `${percentage(occupiedBeds, totalBeds)}%` },
      { label: 'Giường sử dụng', tone: 'blue', value: `${occupiedBeds} / ${totalBeds}` },
      { label: 'Giường trống', tone: 'green', value: String(availableBeds) },
      { label: 'Bảo trì', tone: maintenanceBeds > 0 ? 'amber' : 'slate', value: String(maintenanceBeds) },
    ],
  };
}

/**
 * Lấy cảnh báo kho dược aggregate cho Director, không dùng dữ liệu mock.
 */
export async function getDirectorPharmacyInventory(
  query: DirectorDashboardQuery,
): Promise<DirectorPharmacyInventoryResponse> {
  const range = buildDateRange(query);
  const stats = await getDirectorInventoryStats();
  const alertCount = stats.lowStockBatches + stats.expiringSoonBatches + stats.expiredBatches;

  return {
    alertCount,
    date: range.date,
    period: range.period,
    rows: stats.alertRows.map((batch) => {
      const daysLeft = Math.ceil((batch.expiryDate.getTime() - Date.now()) / 86_400_000);
      const alert = batch.quantity <= 10 ? 'Tồn thấp' : daysLeft < 0 ? 'Đã hết hạn' : 'Sắp hết hạn';
      return {
        cells: [
          batch.medicine.name,
          batch.warehouse.name,
          `${batch.quantity} ${batch.medicine.unit}`,
          alert,
        ],
      };
    }),
    summaryCards: [
      { label: 'Cảnh báo tồn kho', tone: alertCount > 0 ? 'red' : 'green', value: String(alertCount) },
      { label: 'Sắp hết hạn', tone: 'amber', value: String(stats.expiringSoonBatches) },
      { label: 'Mã thuốc theo dõi', tone: 'blue', value: String(stats.activeMedicines) },
      { label: 'Tổng tồn khả dụng', tone: 'teal', value: String(stats.totalQuantity) },
    ],
  };
}

/**
 * Lấy tổng hợp audit theo action/resource/role, không trả log dòng chi tiết.
 */
export async function getDirectorAuditSummary(
  query: DirectorDashboardQuery,
): Promise<DirectorAuditSummaryResponse> {
  const range = buildDateRange(query);
  const stats = await getDirectorAuditStats(range);

  return {
    actionRows: stats.actionGroups.map((group) => ({
      cells: [normalizeLabel(group.label), String(group.count), 'Tổng hợp', 'Không hiển thị PII'],
    })),
    date: range.date,
    period: range.period,
    resourceRows: stats.resourceGroups.map((group) => ({
      cells: [group.label, String(group.count), 'Resource aggregate', 'Read-only'],
    })),
    roleRows: stats.roleGroups.map((group) => ({
      cells: [group.label, String(group.count), 'Role aggregate', 'Không có userName'],
    })),
    summaryCards: [
      { label: 'Sự kiện hệ thống', tone: 'blue', value: String(stats.total) },
      { label: 'Bypass cần chuẩn hóa', tone: stats.bypassCount > 0 ? 'amber' : 'green', value: String(stats.bypassCount) },
      { label: 'Lỗi đăng nhập', tone: stats.loginFailures > 0 ? 'red' : 'green', value: String(stats.loginFailures) },
      emptyCard('Log chi tiết bị ẩn'),
    ],
  };
}
