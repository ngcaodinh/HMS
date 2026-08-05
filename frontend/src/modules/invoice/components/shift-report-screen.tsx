'use client';

import { useState } from 'react';
import { ShiftSummary, TransactionLog } from '../types/invoice.types';

interface ShiftReportScreenProps {
  summary: ShiftSummary | null;
  logs: TransactionLog[];
  onExportReport: () => void;
  fromDate: string;
  toDate: string;
  isLoading: boolean;
  errorMessage: string | null;
  onDateChange: (range: { from: string; to: string }) => void;
}

function formatVnd(value: number | undefined): string {
  return value === undefined ? '—' : `${value.toLocaleString('vi-VN')} đ`;
}

function formatLogDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
}

/** Hiển thị báo cáo ca từ dữ liệu server; khi chưa có API sẽ hiển thị trạng thái rỗng minh bạch. */
export function ShiftReportScreen({
  summary,
  logs,
  onExportReport,
  fromDate,
  toDate,
  isLoading,
  errorMessage,
  onDateChange,
}: ShiftReportScreenProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const hasReportData = summary !== null || logs.length > 0;

  const filteredLogs = logs.filter((l) => {
    if (filterType === 'all') return true;
    if (filterType === 'hd') return l.type === 'invoice_payment';
    if (filterType === 'adv') return l.type === 'advance_deposit';
    if (filterType === 'refund') return l.type === 'advance_refund';
    if (filterType === 'writeoff') return l.type === 'write_off';
    return true;
  });

  return (
    <div className="screen active space-y-4 font-sans select-none animate-fadeIn" id="s5">
      {/* Screen Header matching lines 1401-1414 */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#171c1f] leading-tight">
            Báo cáo tài chính ca trực
          </h2>
          <p className="text-[13px] text-[#707882] mt-0.5">
            {summary
              ? `Ca ${summary.shiftCode} · ${summary.startTime} - ${summary.endTime} · Kế toán phụ trách: `
              : 'Chưa có dữ liệu ca trực từ hệ thống'}
            {summary ? <strong className="text-[#171c1f]">{summary.cashierName}</strong> : null}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={fromDate}
            onChange={(event) => onDateChange({ from: event.target.value, to: toDate })}
            className="h-9 px-3 border border-[#bfc7d2] rounded-md text-[13px] text-[#171c1f] outline-none transition-all duration-150 focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15"
          />
          <input
            type="date"
            value={toDate}
            onChange={(event) => onDateChange({ from: fromDate, to: event.target.value })}
            className="h-9 px-3 border border-[#bfc7d2] rounded-md text-[13px] text-[#171c1f] outline-none transition-all duration-150 focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15"
          />
          <button
            type="button"
            onClick={onExportReport}
            disabled={!hasReportData || isLoading}
            className="px-3.5 py-1.5 bg-[#1a7a4a] text-white rounded-md text-[12.5px] font-bold hover:bg-[#145c38] active:scale-[0.97] transition-all duration-200 ease-out flex items-center gap-1.5 min-h-[36px] shadow-[0_2px_8px_rgba(26,122,74,0.24)] hover:shadow-[0_4px_14px_rgba(26,122,74,0.3)] disabled:cursor-not-allowed disabled:bg-[#bfc7d2] disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {hasReportData ? 'Xuất báo cáo ca trực' : 'Chưa có dữ liệu để xuất'}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid matching lines 1417-1442 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#bfc7d2] shadow-hms-card p-4 relative overflow-hidden transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,96,150,0.14)] border-t-4 border-t-[#006096]">
          <div className="text-[11.5px] font-bold uppercase tracking-wider text-[#707882] mb-1">
            Tổng doanh thu thực tế
          </div>
          <div className="text-[24px] font-bold font-mono text-[#006096] leading-tight mb-1">
            {formatVnd(summary?.netRevenue)}
          </div>
          <div className="text-[11.5px] text-[#707882]">
            Tiền mặt: {formatVnd(summary?.cashTotal)}
            <br />
            Chuyển khoản: {formatVnd(summary?.transferTotal)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#bfc7d2] shadow-hms-card p-4 relative overflow-hidden transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,96,150,0.14)] border-t-4 border-t-[#55d7ed]">
          <div className="text-[11.5px] font-bold uppercase tracking-wider text-[#707882] mb-1">
            Quỹ BHYT chi trả
          </div>
          <div className="text-[24px] font-bold font-mono text-[#006096] leading-tight mb-1">
            {formatVnd(summary?.healthInsuranceTotal)}
          </div>
          <div className="text-[11.5px] text-[#707882]">
            Tổng quỹ BHYT theo hóa đơn đã thanh toán
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#bfc7d2] shadow-hms-card p-4 relative overflow-hidden transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,96,150,0.14)] border-t-4 border-t-[#007abc]">
          <div className="text-[11.5px] font-bold uppercase tracking-wider text-[#707882] mb-1">
            Tổng tiền tạm ứng
          </div>
          <div className="text-[24px] font-bold font-mono text-[#006096] leading-tight mb-1">
            {formatVnd(summary?.advanceCollectedTotal)}
          </div>
          <div className="text-[11.5px] text-[#707882]">
            Hoàn ứng: {formatVnd(summary?.advanceRefundedTotal)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#bfc7d2] shadow-hms-card p-4 relative overflow-hidden transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,96,150,0.14)] border-t-4 border-t-[#ba1a1a]">
          <div className="text-[11.5px] font-bold uppercase tracking-wider text-[#707882] mb-1">
            Miễn giảm thất thu
          </div>
          <div className="text-[24px] font-bold font-mono text-[#ba1a1a] leading-tight mb-1">
            {formatVnd(summary?.writeOffTotal)}
          </div>
          <div className="text-[11.5px] text-[#707882]">
            Tổng giá trị hóa đơn miễn giảm thất thu
          </div>
        </div>
      </div>

      {/* Transaction Log Card matching lines 1445-1505 */}
      <div className="bg-white rounded-xl border border-[#bfc7d2] shadow-hms-card overflow-hidden space-y-3 p-5">
        <div className="flex items-center justify-between border-b border-[#e4e9ed] pb-3">
          <div className="text-[14px] font-bold text-[#171c1f] flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[#006096]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Nhật ký giao dịch chi tiết
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#cee5ff] text-[#006096] font-bold text-[11px]">
            {summary?.totalTransactionsCount ?? logs.length} giao dịch trong ca
          </span>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pb-2 border-b border-[#e4e9ed]">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'hd', label: 'Thanh toán HĐ' },
            { id: 'adv', label: 'Thu tạm ứng' },
            { id: 'refund', label: 'Hoàn ứng' },
            { id: 'writeoff', label: 'Write-off' },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilterType(chip.id)}
              className={`min-h-[36px] px-3.5 py-1 rounded-full text-[12.5px] font-medium border transition-all duration-200 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-1 ${
                filterType === chip.id
                  ? 'bg-[#006096] text-white border-[#006096] shadow-[0_2px_8px_rgba(0,96,150,0.24)]'
                  : 'bg-transparent text-[#3f4851] border-[#bfc7d2] hover:border-[#006096] hover:text-[#006096]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#171c1f]">
            <thead className="bg-[#f0f4f8] text-[11.5px] font-bold text-[#707882] uppercase border-b border-[#e4e9ed]">
              <tr>
                <th className="px-4 py-2.5">Số biên lai / Mã GD</th>
                <th className="px-4 py-2.5">Mã BN / Họ tên</th>
                <th className="px-4 py-2.5">Loại giao dịch</th>
                <th className="px-4 py-2.5">Phương thức</th>
                <th className="px-4 py-2.5 text-right">Số tiền</th>
                <th className="px-4 py-2.5">Thời gian</th>
                <th className="px-4 py-2.5 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f8]">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-[#707882]" colSpan={7}>
                    Đang tải báo cáo từ hệ thống…
                  </td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-[#ba1a1a]" colSpan={7}>
                    {errorMessage}
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-[#707882]" colSpan={7}>
                    Chưa có giao dịch thực tế trong khoảng thời gian đã chọn.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f0f4f8]/70 transition-colors duration-150">
                    <td className="px-4 py-3 font-mono font-bold text-[#006096]">{log.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-[12.5px] text-[#171c1f]">
                        {log.patientCode}
                      </div>
                      <div className="text-[11.5px] text-[#707882]">{log.patientName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#cee5ff] text-[#006096] font-semibold text-[11px]">
                        {log.type === 'invoice_payment' && 'Thanh toán HĐ'}
                        {log.type === 'advance_deposit' && 'Thu tạm ứng'}
                        {log.type === 'advance_refund' && 'Hoàn ứng'}
                        {log.type === 'write_off' && 'Write-off'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#cee5ff] text-[#006096] font-semibold text-[11px] uppercase">
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-[#1a7a4a]">
                      + {log.amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#707882]">
                      <span className="font-mono">{log.time}</span>
                      <br />
                      {formatLogDate(log.time)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] font-bold text-[10.5px]">
                        Thành công
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
