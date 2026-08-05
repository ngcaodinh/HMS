import { apiClient, type ApiSuccess } from '@/shared/api-client/api-client';

import type { ShiftSummary, TransactionLog } from '../types/invoice.types';

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

/** Tải báo cáo thu phí theo ngày từ backend, mọi số tiền vẫn là chuỗi Decimal. */
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
