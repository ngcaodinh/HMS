import { apiClient, type ApiSuccess } from '@/shared/api-client/api-client';

import type { ShiftSummary, TransactionLog } from '../types/invoice.types';

/**
 * Contract trên wire của báo cáo thu phí.
 * Các trường tiền là chuỗi Decimal do backend định dạng 2 chữ số thập phân; adapter chỉ chuyển
 * sang `number` cho view và không tự làm tròn lại doanh thu, BHYT, tạm ứng hay miễn giảm.
 */
type AccountingReportResponse = {
  summary: Omit<ShiftSummary, 'cashTotal' | 'transferTotal' | 'advanceCollectedTotal' | 'advanceRefundedTotal' | 'netRevenue'> & {
    cashTotal: string;
    transferTotal: string;
    advanceCollectedTotal: string;
    advanceRefundedTotal: string;
    healthInsuranceTotal: string;
    writeOffTotal: string;
    netRevenue: string;
  };
  logs: Array<Omit<TransactionLog, 'amount'> & { amount: string }>;
};

/**
 * Tải báo cáo thu phí theo khoảng ngày và chuẩn hóa response cho màn hình kế toán.
 *
 * @param from - Ngày bắt đầu theo định dạng `YYYY-MM-DD`, bao gồm trong khoảng truy vấn.
 * @param to - Ngày kết thúc theo định dạng `YYYY-MM-DD`, bao gồm trong khoảng truy vấn.
 * @returns Tổng hợp ca thu và danh sách giao dịch; các khoản tiền đã chuyển từ chuỗi Decimal sang
 *   `number` để hiển thị, vẫn mang đơn vị VNĐ.
 * @remarks Gọi `GET /accounting-reports` với query `from`/`to`, yêu cầu quyền đọc hóa đơn. Backend
 *   là nguồn quyết định số liệu cash, MoMo/chuyển khoản, BHYT, tạm ứng, hoàn tiền và write-off;
 *   lỗi HTTP hoặc lỗi quyền được giữ nguyên để lớp gọi xử lý.
 */
export async function getAccountingReport(
  from: string,
  to: string,
): Promise<{ summary: ShiftSummary; logs: TransactionLog[] }> {
  const response = await apiClient.get<ApiSuccess<AccountingReportResponse>>('/accounting-reports', {
    params: { from, to },
  });
  const { summary, logs } = response.data.data;
  return {
    summary: {
      ...summary,
      cashTotal: Number(summary.cashTotal),
      transferTotal: Number(summary.transferTotal),
      advanceCollectedTotal: Number(summary.advanceCollectedTotal),
      advanceRefundedTotal: Number(summary.advanceRefundedTotal),
      healthInsuranceTotal: Number(summary.healthInsuranceTotal),
      writeOffTotal: Number(summary.writeOffTotal),
      netRevenue: Number(summary.netRevenue),
      totalTransactionsCount: summary.totalTransactionsCount,
    },
    logs: logs.map((log) => ({ ...log, amount: Number(log.amount) })),
  };
}
