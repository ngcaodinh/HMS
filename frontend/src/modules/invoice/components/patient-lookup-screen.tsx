'use client';

import { useState } from 'react';
import { PatientRecord } from '../types/invoice.types';

interface PatientLookupScreenProps {
  patients: PatientRecord[];
  onSelectPatientForInvoice: (patient: PatientRecord) => void;
  onSelectPatientForAdvance: (patient: PatientRecord) => void;
}

export function PatientLookupScreen({
  patients,
  onSelectPatientForInvoice,
}: PatientLookupScreenProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [activeFilterStatus, setActiveFilterStatus] = useState<string>('all');

  const filteredPatients = patients.filter((p) => {
    if (activeFilterStatus !== 'all') {
      if (activeFilterStatus === 'pending' && p.status !== 'pending_payment') return false;
      if (activeFilterStatus === 'paid' && p.status !== 'settled') return false;
      if (activeFilterStatus === 'cancelled' && p.status !== 'refunded') return false;
      if (activeFilterStatus === 'writeoff' && p.status !== 'pending_payment') return false;
    }

    if (
      selectedDept &&
      !p.department.toLowerCase().includes(selectedDept.toLowerCase()) &&
      !p.bhytCategory.toLowerCase().includes(selectedDept.toLowerCase())
    ) {
      return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const matchName = p.fullName.toLowerCase().includes(term);
      const matchCode = p.code.toLowerCase().includes(term);
      const matchBhyt = p.bhytCardNumber.toLowerCase().includes(term);
      const matchDept = p.department.toLowerCase().includes(term);
      if (!matchName && !matchCode && !matchBhyt && !matchDept) return false;
    }

    return true;
  });

  return (
    <div className="screen active space-y-4 font-sans select-none" id="s1">
      {/* Screen Header matching doc/ke_toan copy.html lines 902-919 */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#171c1f] leading-tight">
            Tra cứu hồ sơ &amp; Hóa đơn viện phí
          </h2>
          <p className="text-[13px] text-[#707882] mt-0.5">
            Hiển thị tất cả hồ sơ tài chính phát sinh trong ngày — Thứ Hai, 20/07/2026
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-[38px] px-3 border border-[#bfc7d2] rounded-md bg-white text-[13px] text-[#171c1f] outline-none focus:border-[#006096]"
          >
            <option value="">Tất cả khoa</option>
            <option value="Khoa Da Liễu">Khoa Da Liễu</option>
            <option value="Khoa Cấp Cứu">Khoa Cấp Cứu</option>
            <option value="Nội trú">Nội trú Da Liễu</option>
          </select>
          <button
            type="button"
            onClick={() => {}}
            className="min-h-[36px] px-3 py-1.5 border border-[#bfc7d2] bg-[#f8fafc] text-[#707882] rounded-md text-[12.5px] font-medium hover:bg-[#eaeef2] transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Tải lại hồ sơ mới
          </button>
        </div>
      </div>

      {/* Card with Filter Toolbar & Table */}
      <div className="bg-white rounded-xl border border-[#bfc7d2] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Filter Toolbar matching lines 923-947 */}
        <div className="p-4 border-b border-[#e4e9ed]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-[380px] min-w-[240px]">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707882]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo Họ tên, SĐT, CCCD, Mã BN..."
                className="w-full h-10 pl-9 pr-3 border border-[#bfc7d2] rounded-md text-[13.5px] text-[#171c1f] outline-none placeholder:text-[#707882] focus:border-[#006096]"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'Tất cả hồ sơ' },
                { id: 'pending', label: 'Chờ thanh toán', color: '#a05c00' },
                { id: 'paid', label: 'Đã thanh toán', color: '#ba1a1a' },
                { id: 'cancelled', label: 'Đã hủy', color: '#707882' },
                { id: 'writeoff', label: 'Thất thu (Write-off)', color: '#ba1a1a' },
              ].map((chip) => {
                const isActive = activeFilterStatus === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setActiveFilterStatus(chip.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#006096] text-white border-[#006096]'
                        : 'bg-transparent text-[#3f4851] border-[#bfc7d2] hover:border-[#006096] hover:text-[#006096]'
                    }`}
                  >
                    {chip.color && (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: isActive ? '#ffffff' : chip.color }}
                      />
                    )}
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Data Table matching lines 950-967 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#171c1f]">
            <thead className="bg-[#f0f4f8] text-[11.5px] font-bold text-[#707882] uppercase border-b border-[#e4e9ed]">
              <tr>
                <th className="px-4 py-2.5">Mã bệnh nhân</th>
                <th className="px-4 py-2.5">Họ tên bệnh nhân</th>
                <th className="px-4 py-2.5">Loại hồ sơ</th>
                <th className="px-4 py-2.5">Khoa / Phòng</th>
                <th className="px-4 py-2.5">Trạng thái</th>
                <th className="px-4 py-2.5 text-right">Tổng tiền (tạm tính)</th>
                <th className="px-4 py-2.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f8]">
              {filteredPatients.map((p) => {
                const isNoiTru = p.department.includes('Nội trú');
                const isCapCuu = p.department.includes('Cấp Cứu');
                return (
                  <tr key={p.id} className="hover:bg-[#f0f4f8]/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-[#006096]">{p.code}</td>
                    <td className="px-4 py-3 font-bold text-[#171c1f]">{p.fullName}</td>
                    <td className="px-4 py-3">
                      {isNoiTru && (
                        <span className="px-2.5 py-1 rounded-full bg-[#ede7f6] text-[#4527a0] font-semibold text-[11px]">
                          Nội trú
                        </span>
                      )}
                      {isCapCuu && (
                        <span className="px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#ba1a1a] font-semibold text-[11px]">
                          Cấp cứu
                        </span>
                      )}
                      {!isNoiTru && !isCapCuu && (
                        <span className="px-2.5 py-1 rounded-full bg-[#e3f2fd] text-[#1565c0] font-semibold text-[11px]">
                          Ngoại trú
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#3f4851]">{p.department}</td>
                    <td className="px-4 py-3">
                      {p.status === 'pending_payment' && (
                        <span className="px-2.5 py-1 rounded-full bg-[#fff8e1] text-[#a05c00] font-bold text-[11px] inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#a05c00]" />
                          Chờ thanh toán
                        </span>
                      )}
                      {p.status === 'settled' && (
                        <span className="px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#ba1a1a] font-bold text-[11px] inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                          Đã thanh toán
                        </span>
                      )}
                      {p.status === 'refunded' && (
                        <span className="px-2.5 py-1 rounded-full bg-[#f0f4f8] text-[#707882] font-bold text-[11px] inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#707882]" />
                          Đã hủy
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-[#171c1f]">
                      {p.totalServicesAmount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.status === 'pending_payment' && (
                        <button
                          type="button"
                          onClick={() => onSelectPatientForInvoice(p)}
                          className="px-3 py-1.5 bg-[#006096] text-white rounded-md text-[12.5px] font-semibold hover:bg-[#004a75] transition-colors inline-flex items-center gap-1 min-h-[36px]"
                        >
                          <svg
                            className="w-3.5 h-3.5"
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
                          Lập hóa đơn
                        </button>
                      )}
                      {p.status === 'settled' && (
                        <button
                          type="button"
                          onClick={() => onSelectPatientForInvoice(p)}
                          className="px-3 py-1.5 border border-[#bfc7d2] bg-[#f8fafc] text-[#3f4851] rounded-md text-[12.5px] font-semibold hover:bg-[#eaeef2] transition-colors inline-flex items-center gap-1 min-h-[36px]"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Xem / In lại
                        </button>
                      )}
                      {p.status === 'refunded' && (
                        <span className="text-[12px] text-[#707882] font-semibold">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar matching lines 970-981 */}
        <div className="px-4 py-3 border-t border-[#e4e9ed] flex items-center justify-between text-[12.5px] text-[#707882]">
          <span>
            Hiển thị{' '}
            <strong>
              {filteredPatients.length} / {patients.length}
            </strong>{' '}
            hồ sơ trong ngày
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="px-3 py-1.5 border border-[#bfc7d2] rounded-md text-[12.5px] font-medium text-[#707882] hover:border-[#006096] hover:text-[#006096]"
            >
              &larr; Trước
            </button>
            <button
              type="button"
              className="px-3 py-1.5 bg-[#006096] text-white border border-[#006096] rounded-md text-[12.5px] font-bold"
            >
              1
            </button>
            <button
              type="button"
              className="px-3 py-1.5 border border-[#bfc7d2] rounded-md text-[12.5px] font-medium text-[#707882] hover:border-[#006096] hover:text-[#006096]"
            >
              Tiếp &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
