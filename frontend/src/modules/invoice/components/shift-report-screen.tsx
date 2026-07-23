'use client';

import { useState } from 'react';
import { ShiftSummary, TransactionLog } from '../types/invoice.types';

interface ShiftReportScreenProps {
  summary: ShiftSummary;
  logs: TransactionLog[];
  onExportReport: () => void;
}

export function ShiftReportScreen({ logs, onExportReport }: ShiftReportScreenProps) {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = logs.filter((l) => {
    if (filterType === 'all') return true;
    if (filterType === 'hd') return l.type === 'invoice_payment';
    if (filterType === 'adv') return l.type === 'advance_deposit';
    if (filterType === 'refund') return l.type === 'advance_refund';
    return true;
  });

  return (
    <div className="screen active space-y-4 font-sans select-none" id="s5">
      {/* Screen Header matching lines 1401-1414 */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#171c1f] leading-tight">
            Báo cáo tài chính ca trực
          </h2>
          <p className="text-[13px] text-[#707882] mt-0.5">
            Ca trực từ 07:00 · 20/07/2026 · Kế toán phụ trách:{' '}
            <strong className="text-[#171c1f]">Nguyễn Văn A</strong>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            defaultValue="2026-07-20"
            className="h-9 px-3 border border-[#bfc7d2] rounded-md text-[13px] text-[#171c1f] outline-none"
          />
          <input
            type="date"
            defaultValue="2026-07-20"
            className="h-9 px-3 border border-[#bfc7d2] rounded-md text-[13px] text-[#171c1f] outline-none"
          />
          <button
            type="button"
            onClick={onExportReport}
            className="px-3.5 py-1.5 bg-[#1a7a4a] text-white rounded-md text-[12.5px] font-bold hover:bg-[#145c38] transition-colors flex items-center gap-1.5 min-h-[36px]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Xuất báo cáo ca trực
          </button>
        </div>
      </div>

      {/* KPI Cards Grid matching lines 1417-1442 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#bfc7d2] shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-4 relative overflow-hidden border-t-4 border-t-[#006096]">
          <div className="text-[11.5px] font-bold uppercase tracking-wider text-[#707882] mb-1">
            Tổng doanh thu thực tế
          </div>
          <div className="text-[24px] font-bold font-mono text-[#006096] leading-tight mb-1">
            8.650.000 đ
          </div>
          <div className="text-[11.5px] text-[#707882]">
            Tiền mặt: 6.150.000 đ<br />
            Momo: 2.500.000 đ
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#bfc7d2] shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-4 relative overflow-hidden border-t-4 border-t-[#55d7ed]">
          <div className="text-[11.5px] font-bold uppercase tracking-wider text-[#707882] mb-1">
            Quỹ BHYT chi trả
          </div>
          <div className="text-[24px] font-bold font-mono text-[#006096] leading-tight mb-1">
            3.220.000 đ
          </div>
          <div className="text-[11.5px] text-[#707882]">Giảm trừ cho 5 bệnh nhân</div>
        </div>

        <div className="bg-white rounded-xl border border-[#bfc7d2] shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-4 relative overflow-hidden border-t-4 border-t-[#007abc]">
          <div className="text-[11.5px] font-bold uppercase tracking-wider text-[#707882] mb-1">
            Tổng tiền tạm ứng
          </div>
          <div className="text-[24px] font-bold font-mono text-[#006096] leading-tight mb-1">
            5.000.000 đ
          </div>
          <div className="text-[11.5px] text-[#707882]">1 bệnh nhân nội trú · 2 đợt</div>
        </div>

        <div className="bg-white rounded-xl border border-[#bfc7d2] shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-4 relative overflow-hidden border-t-4 border-t-[#ba1a1a]">
          <div className="text-[11.5px] font-bold uppercase tracking-wider text-[#707882] mb-1">
            Miễn giảm thất thu
          </div>
          <div className="text-[24px] font-bold font-mono text-[#ba1a1a] leading-tight mb-1">
            890.000 đ
          </div>
          <div className="text-[11.5px] text-[#707882]">1 ca cấp cứu Write-off</div>
        </div>
      </div>

      {/* Transaction Log Card matching lines 1445-1505 */}
      <div className="bg-white rounded-xl border border-[#bfc7d2] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden space-y-3 p-5">
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
            7 giao dịch trong ca
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
              className={`min-h-[36px] px-3.5 py-1 rounded-full text-[12.5px] font-medium border transition-colors ${
                filterType === chip.id
                  ? 'bg-[#006096] text-white border-[#006096]'
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
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#f0f4f8]/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-[#006096]">
                    RCP-2026-0{log.id}
                  </td>
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
                    20/07/2026
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] font-bold text-[10.5px]">
                      Thành công
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
