'use client';

import { useState } from 'react';
import { Invoice, PatientRecord } from '../types/invoice.types';

interface InvoiceCreationScreenProps {
  patient: PatientRecord;
  invoice: Invoice;
  onProceedToPayment: (updatedInvoice: Invoice) => void;
  onBack: () => void;
}

export function InvoiceCreationScreen({
  patient,
  invoice,
  onProceedToPayment,
  onBack,
}: InvoiceCreationScreenProps) {
  const [bhytRate, setBhytRate] = useState<number>(patient.bhytBenefitRate * 100 || 80);
  const [bhytRoute, setBhytRoute] = useState<string>('Đúng tuyến');

  const calculateTotals = () => {
    let subtotal = 0;
    let bhytTotal = 0;

    invoice.items.forEach((item) => {
      subtotal += item.totalPrice;
      const rateFraction = bhytRate / 100;
      if (item.bhytCoverRate > 0) {
        bhytTotal += Math.round(item.totalPrice * rateFraction);
      }
    });

    const finalAmount = Math.max(0, subtotal - bhytTotal);
    return { subtotal, bhytTotal, finalAmount };
  };

  const { subtotal, bhytTotal, finalAmount } = calculateTotals();

  const handleConfirmInvoice = () => {
    const updatedInvoice: Invoice = {
      ...invoice,
      subtotal,
      bhytDiscount: bhytTotal,
      finalAmount,
      status: 'pending_payment',
    };
    onProceedToPayment(updatedInvoice);
  };

  return (
    <div className="screen active space-y-4 font-sans select-none" id="s2">
      {/* Screen Header matching lines 990-1000 */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#171c1f] leading-tight">
            Lập hóa đơn viện phí
          </h2>
          <p className="text-[13px] text-[#707882] mt-0.5">
            Chi tiết lập hóa đơn cho bệnh nhân:{' '}
            <strong className="text-[#171c1f]">
              {patient.code} — {patient.fullName}
            </strong>{' '}
            &nbsp;
            <span className="px-2.5 py-0.5 rounded-full bg-[#e3f2fd] text-[#1565c0] font-bold text-[11px]">
              Ngoại trú
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1.5 border border-[#bfc7d2] bg-[#f8fafc] text-[#707882] rounded-md text-[12.5px] font-medium hover:bg-[#eaeef2] transition-colors flex items-center gap-1.5 min-h-[36px]"
        >
          &larr; Quay lại danh sách
        </button>
      </div>

      {/* Patient Summary Card matching lines 1003-1024 */}
      <div className="bg-white rounded-xl border border-[#bfc7d2] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e4e9ed] flex items-center justify-between">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Thông tin bệnh nhân &amp; Thẻ BHYT
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#d4f4e2] text-[#1a7a4a] font-bold text-[11px]">
            Thẻ BHYT còn hạn
          </span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
            <div>
              <span className="block text-[11px] font-semibold uppercase text-[#707882] mb-0.5">
                Họ và tên
              </span>
              <strong className="text-[#171c1f] text-sm">{patient.fullName}</strong>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase text-[#707882] mb-0.5">
                Ngày sinh &amp; Giới tính
              </span>
              <span className="text-[#171c1f] font-medium">
                {patient.dob} · {patient.gender}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase text-[#707882] mb-0.5">
                Số điện thoại
              </span>
              <span className="font-mono text-[#171c1f]">0901 234 567</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase text-[#707882] mb-0.5">
                Số thẻ BHYT
              </span>
              <span className="font-mono font-bold text-[#006096]">{patient.bhytCardNumber}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase text-[#707882] mb-0.5">
                Hạn thẻ BHYT
              </span>
              <span className="font-bold text-[#1a7a4a]">31/12/2026</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase text-[#707882] mb-0.5">
                Số CCCD
              </span>
              <span className="font-mono text-[#171c1f]">001095001234</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase text-[#707882] mb-0.5">
                Khoa điều trị
              </span>
              <span className="text-[#171c1f]">{patient.department}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase text-[#707882] mb-0.5">
                Mã bệnh nhân
              </span>
              <span className="font-mono font-bold text-[#006096]">{patient.code}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase text-[#707882] mb-0.5">
                Ngày khám
              </span>
              <span className="text-[#171c1f]">20/07/2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* BHYT Config Card matching lines 1027-1060 */}
      <div className="bg-white rounded-xl border border-[#bfc7d2] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e4e9ed] flex items-center justify-between">
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Cấu hình Bảo hiểm y tế (BHYT)
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 bg-[#e3f2fd] text-[#1565c0] border border-[#bfdbfe] rounded-lg text-[13px] flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Tất cả tỷ lệ và số tiền giảm trừ được thuật toán hệ thống tính tự động — Kế toán không
            can thiệp nhập tay.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-[#707882] mb-1">
                Mức hưởng BHYT
              </label>
              <select
                value={bhytRate}
                onChange={(e) => setBhytRate(Number(e.target.value))}
                className="w-full h-10 px-3 border border-[#bfc7d2] rounded-md bg-white text-[13px] text-[#171c1f] outline-none focus:border-[#006096]"
              >
                <option value={0}>Không hưởng (0%)</option>
                <option value={80}>Mức 80%</option>
                <option value={95}>Mức 95%</option>
                <option value={100}>Mức 100%</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#707882] mb-1">
                Tuyến khám BHYT
              </label>
              <select
                value={bhytRoute}
                onChange={(e) => setBhytRoute(e.target.value)}
                className="w-full h-10 px-3 border border-[#bfc7d2] rounded-md bg-white text-[13px] text-[#171c1f] outline-none focus:border-[#006096]"
              >
                <option value="Đúng tuyến">Đúng tuyến (100% tỷ lệ hưởng)</option>
                <option value="Chuyển tuyến">Chuyển tuyến hợp lệ</option>
                <option value="Cấp cứu">Cấp cứu (Hưởng 100% mức BHYT)</option>
                <option value="Trái tuyến">Trái tuyến (Giảm 40% chi trả)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Services Table Card matching lines 1063-1089 */}
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Danh mục dịch vụ y tế phát sinh
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#cee5ff] text-[#006096] font-bold text-[11px]">
            {invoice.items.length} dịch vụ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#171c1f]">
            <thead className="bg-[#f0f4f8] text-[11.5px] font-bold text-[#707882] uppercase border-b border-[#e4e9ed]">
              <tr>
                <th className="px-4 py-2.5">Tên dịch vụ / Thuốc / Xét nghiệm</th>
                <th className="px-4 py-2.5 text-center">SL</th>
                <th className="px-4 py-2.5 text-right">Đơn giá gốc</th>
                <th className="px-4 py-2.5 text-right">Thành tiền</th>
                <th className="px-4 py-2.5 text-center">Phạm vi BHYT</th>
                <th className="px-4 py-2.5 text-right">BHYT chi trả</th>
                <th className="px-4 py-2.5 text-right">BN cùng trả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f8]">
              {invoice.items.map((item) => {
                const isBhytCovered = item.bhytCoverRate > 0 && bhytRate > 0;
                const bhytPaysItem = isBhytCovered
                  ? Math.round(item.totalPrice * (bhytRate / 100))
                  : 0;
                const patientPaysItem = item.totalPrice - bhytPaysItem;

                return (
                  <tr key={item.id} className="hover:bg-[#f0f4f8]/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#171c1f]">{item.name}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {item.unitPrice.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                      {item.totalPrice.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isBhytCovered ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#d4f4e2] text-[#1a7a4a] font-bold text-[10.5px]">
                          Trong danh mục
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#f0f4f8] text-[#707882] font-bold text-[10.5px]">
                          Tự trả 100%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#1a7a4a] tabular-nums">
                      {bhytPaysItem > 0 ? `${bhytPaysItem.toLocaleString('vi-VN')} đ` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#006096] tabular-nums">
                      {patientPaysItem.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom: Note + Total matching lines 1092-1112 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#bfc7d2] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-2">
          <h4 className="text-[13px] font-bold text-[#171c1f]">
            Ghi chú lâm sàng từ bác sĩ điều trị
          </h4>
          <p className="text-xs text-[#3f4851] leading-relaxed">
            Bệnh nhân được chẩn đoán viêm da tiếp xúc dị ứng (ICD-10: L23.9). Đã thực hiện sinh
            thiết da vùng cẳng tay phải. Kết quả GPB khớp lâm sàng. Kê đơn thuốc bôi và uống trong
            14 ngày, tái khám sau 2 tuần.
          </p>
          <div className="text-[12px] text-[#707882] pt-2 border-t border-[#e4e9ed]">
            Bác sĩ: Lê Thành Tâm · 20/07/2026 07:30
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-gradient-to-br from-[#006096] to-[#004068] text-white rounded-xl p-5 shadow-lg space-y-2.5">
            <div className="flex justify-between items-center text-[13px]">
              <span className="opacity-85">Tổng chi phí gốc</span>
              <span className="font-mono font-bold">{subtotal.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="opacity-85">Cơ sở tính BHYT</span>
              <span className="font-mono font-bold">1.075.000 đ</span>
            </div>
            <div className="flex justify-between items-center text-[13px] text-emerald-300">
              <span className="opacity-85">Quỹ BHYT chi trả</span>
              <span className="font-mono font-bold">− {bhytTotal.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="border-t border-white/20 pt-3 flex justify-between items-center text-base font-bold">
              <span>Bệnh nhân phải trả</span>
              <span className="font-mono text-2xl font-extrabold">
                {finalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmInvoice}
            className="w-full py-3 bg-[#006096] text-white rounded-lg font-bold text-sm hover:bg-[#004a75] transition-colors shadow-md flex items-center justify-center gap-2 min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
              />
            </svg>
            Xuất hóa đơn &amp; Bảng kê
          </button>
        </div>
      </div>
    </div>
  );
}
