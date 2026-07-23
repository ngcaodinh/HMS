'use client';

import { useState } from 'react';
import { AdvanceReceipt, PatientRecord } from '../types/invoice.types';

interface AdvanceManagementScreenProps {
  patients: PatientRecord[];
  receipts: AdvanceReceipt[];
  onOpenAdvanceModal: () => void;
  onOpenRefundModal: () => void;
}

export function AdvanceManagementScreen({
  patients,
  receipts,
  onOpenAdvanceModal,
  onOpenRefundModal,
}: AdvanceManagementScreenProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'refund'>('deposit');
  const [selectedPatientCode, setSelectedPatientCode] = useState<string>('BN-2026-0091');
  const [advanceInput, setAdvanceInput] = useState<string>('2.000.000');
  const [advanceReason, setAdvanceReason] = useState<string>(
    'Tạm ứng nhập viện nội trú đợt bổ sung',
  );

  const currentPatient = patients.find((p) => p.code === selectedPatientCode) || patients[1];

  return (
    <div className="screen active space-y-4 font-sans select-none" id="s4">
      {/* Screen Header matching lines 1267-1284 */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#171c1f] leading-tight">
            Quản lý tạm ứng nội trú
          </h2>
          <p className="text-[13px] text-[#707882] mt-0.5">
            Tạm ứng &amp; Hoàn ứng cho bệnh nhân nội trú
          </p>
        </div>
        <div className="w-80">
          <select
            value={selectedPatientCode}
            onChange={(e) => setSelectedPatientCode(e.target.value)}
            className="w-full h-10 px-3 border border-[#bfc7d2] rounded-md bg-white text-[13px] font-semibold text-[#171c1f] outline-none focus:border-[#006096]"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.code}>
                {p.fullName} ({p.code}) — {p.department}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Mini Info Card matching lines 1287-1296 */}
      <div className="bg-white rounded-xl border border-[#bfc7d2] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882] mb-0.5">
              Họ tên
            </span>
            <strong className="text-[#171c1f] font-bold">{currentPatient.fullName}</strong>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882] mb-0.5">
              Mã BN
            </span>
            <span className="font-mono font-bold text-[#006096]">{currentPatient.code}</span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882] mb-0.5">
              Khoa / Buồng
            </span>
            <span className="text-[#171c1f] font-medium">{currentPatient.department}</span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882] mb-0.5">
              Ngày nhập viện
            </span>
            <span className="text-[#171c1f]">17/07/2026</span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs matching lines 1298-1308 */}
      <div className="flex border-b-2 border-[#e4e9ed] bg-white rounded-t-xl px-4 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab('deposit')}
          className={`px-5 py-3 text-[13.5px] font-semibold transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeTab === 'deposit'
              ? 'border-[#006096] text-[#006096]'
              : 'border-transparent text-[#707882] hover:text-[#006096]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9l9-7 9 7v11a2 2 0 002 2H5a2 2 0 002-2z"
            />
          </svg>
          Thu tạm ứng
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('refund')}
          className={`px-5 py-3 text-[13.5px] font-semibold transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeTab === 'refund'
              ? 'border-[#006096] text-[#006096]'
              : 'border-transparent text-[#707882] hover:text-[#006096]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Đối soát &amp; Hoàn trả
        </button>
      </div>

      {/* Tab 1: Thu tạm ứng matching lines 1311-1360 */}
      {activeTab === 'deposit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white rounded-b-xl border border-[#bfc7d2] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          {/* Form */}
          <div className="space-y-4">
            <div className="text-[14px] font-bold text-[#171c1f] flex items-center gap-2 border-b border-[#e4e9ed] pb-3">
              <svg
                className="w-4 h-4 text-[#006096]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={2} />
                <circle cx="12" cy="12" r="2" strokeWidth={2} />
              </svg>
              Biểu mẫu thu tiền tạm ứng
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#707882] mb-1">
                Số tiền tạm ứng (VNĐ) *
              </label>
              <input
                type="text"
                value={advanceInput}
                onChange={(e) => setAdvanceInput(e.target.value)}
                placeholder="Nhập số tiền, VD: 2000000"
                className="w-full h-10 px-3 border border-[#bfc7d2] rounded-md font-mono font-bold text-[#171c1f] text-[13.5px] outline-none focus:border-[#006096]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#707882] mb-1">
                Lý do tạm ứng *
              </label>
              <textarea
                rows={3}
                value={advanceReason}
                onChange={(e) => setAdvanceReason(e.target.value)}
                placeholder="Tạm ứng điều trị nội trú..."
                className="w-full p-3 border border-[#bfc7d2] rounded-md text-[13.5px] text-[#171c1f] outline-none focus:border-[#006096]"
              />
            </div>

            <button
              type="button"
              onClick={onOpenAdvanceModal}
              className="w-full py-3 bg-[#006096] text-white rounded-md font-bold text-sm hover:bg-[#004a75] transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Thu tiền &amp; In phiếu tạm ứng
            </button>
          </div>

          {/* History */}
          <div className="space-y-4">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                  />
                </svg>
                Lịch sử tạm ứng
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#cee5ff] text-[#006096] font-bold text-[11px]">
                2 đợt
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#f0f4f8] rounded-md border border-[#e4e9ed] flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-[13px] text-[#171c1f]">
                    ADV-2026-0012
                  </div>
                  <div className="text-[11.5px] text-[#707882]">
                    17/07/2026 · 08:12 · Nguyễn Văn A
                  </div>
                  <div className="text-[11.5px] text-[#707882] mt-0.5">
                    Tạm ứng nhập viện nội trú
                  </div>
                </div>
                <span className="font-mono font-bold text-[#1a7a4a] text-sm">+ 3.000.000 đ</span>
              </div>

              <div className="p-3 bg-[#f0f4f8] rounded-md border border-[#e4e9ed] flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-[13px] text-[#171c1f]">
                    ADV-2026-0018
                  </div>
                  <div className="text-[11.5px] text-[#707882]">
                    19/07/2026 · 09:45 · Nguyễn Văn A
                  </div>
                  <div className="text-[11.5px] text-[#707882] mt-0.5">Bổ sung tạm ứng ngày 3</div>
                </div>
                <span className="font-mono font-bold text-[#1a7a4a] text-sm">+ 2.000.000 đ</span>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-[#bfc7d2] flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#171c1f]">Tổng đã tạm ứng</span>
              <span className="font-mono font-bold text-[#006096] text-base">5.000.000 đ</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Refund matching lines 1363-1393 */}
      {activeTab === 'refund' && (
        <div className="bg-white rounded-b-xl border border-[#bfc7d2] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#ffdad6] p-4 rounded-xl text-center border border-[#f5c6c6]">
              <h4 className="text-[11.5px] font-bold uppercase text-[#ba1a1a]">
                Tổng viện phí thực tế
              </h4>
              <div className="text-[22px] font-bold font-mono text-[#ba1a1a] mt-1">4.200.000 đ</div>
              <div className="text-[11.5px] text-[#707882] mt-1">Đã lập hóa đơn #INV-2026-0315</div>
            </div>

            <div className="bg-[#cee5ff] p-4 rounded-xl text-center border border-[#96ccff]">
              <h4 className="text-[11.5px] font-bold uppercase text-[#006096]">
                Tổng tiền đã tạm ứng
              </h4>
              <div className="text-[22px] font-bold font-mono text-[#006096] mt-1">5.000.000 đ</div>
              <div className="text-[11.5px] text-[#707882] mt-1">2 đợt tạm ứng</div>
            </div>
          </div>

          <div className="bg-[#d4f4e2] border border-[#a7f0c8] rounded-xl p-5 text-center space-y-1">
            <div className="text-[28px] font-bold font-mono text-[#1a7a4a] tabular-nums">
              + 800.000 đ
            </div>
            <div className="text-[12px] font-bold text-[#1a7a4a]">Bệnh viện hoàn trả bệnh nhân</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-[#707882] mb-1">
                Lý do hoàn trả * (tối thiểu 10 ký tự)
              </label>
              <textarea
                rows={3}
                defaultValue="Hoàn trả tiền tạm ứng dư sau khi bệnh nhân xuất viện ngày 20/07/2026"
                className="w-full p-3 border border-[#bfc7d2] rounded-md text-[13.5px] text-[#171c1f] outline-none focus:border-[#006096]"
              />
            </div>

            <button
              type="button"
              onClick={onOpenRefundModal}
              className="w-full py-3 bg-[#1a7a4a] text-white rounded-md font-bold text-sm hover:bg-[#145c38] transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
            >
              Xác nhận hoàn trả &amp; In phiếu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
