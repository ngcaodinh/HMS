'use client';

import { useState } from 'react';
import { Invoice, PatientRecord } from '../types/invoice.types';

interface PaymentStatementScreenProps {
  patient: PatientRecord;
  invoice: Invoice;
  onOpenCashModal: () => void;
  onOpenMomoModal: () => void;
  onOpenCancelModal: () => void;
  onOpenWriteoffModal: () => void;
  onConfirmSuccess: () => void;
  onBack: () => void;
}

export function PaymentStatementScreen({
  patient,
  invoice,
  onOpenCashModal,
  onOpenMomoModal,
  onOpenCancelModal,
  onOpenWriteoffModal,
  onConfirmSuccess,
  onBack,
}: PaymentStatementScreenProps) {
  const [isSigned, setIsSigned] = useState<boolean>(true);
  const isPaid = patient.status === 'settled' || invoice.status === 'paid';

  return (
    <div className="screen active space-y-4 font-sans select-none" id="s3">
      {/* Screen Header matching lines 1119-1131 */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#171c1f] leading-tight">
            Thanh toán &amp; Bảng kê chi phí
          </h2>
          <p className="text-[13px] text-[#707882] mt-0.5">
            Mã hóa đơn:{' '}
            <span className="font-mono text-[#006096] font-bold">{invoice.invoiceNumber}</span> ·
            Bệnh nhân:{' '}
            <strong className="text-[#171c1f]">
              {patient.fullName} ({patient.code})
            </strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isPaid ? (
            <span className="px-3.5 py-1.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] font-bold text-[12.5px] inline-flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse" />
              Đã thanh toán
            </span>
          ) : (
            <span className="px-3.5 py-1.5 rounded-full bg-[#fff8e1] text-[#a05c00] font-bold text-[12.5px] inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a05c00]" />
              Chờ thanh toán
            </span>
          )}

          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-1.5 border border-[#bfc7d2] bg-[#f8fafc] text-[#707882] rounded-md text-[12.5px] font-medium hover:bg-[#eaeef2] transition-colors flex items-center gap-1.5 min-h-[36px]"
          >
            &larr; Quay lại
          </button>
        </div>
      </div>

      {/* Main Split Layout matching lines 1133-1259 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left Side: A4 Document Preview */}
        <div className="bg-white rounded-xl border border-[#bfc7d2] p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)] relative space-y-5 min-h-[600px]">
          {/* Watermark Stamp Overlay matching paid-watermark in ke_toan copy.html line 1136 */}
          {isPaid && (
            <div className="absolute top-[120px] right-[40px] border-[4px] border-[#ba1a1a] rounded-lg px-6 py-2 font-black text-[#ba1a1a] text-[32px] tracking-[4px] rotate-[-18deg] opacity-[0.25] pointer-events-none select-none">
              ĐÃ THANH TOÁN
            </div>
          )}

          {/* Hospital Header */}
          <div className="text-center">
            <h2 className="text-[14px] font-bold text-[#171c1f]">BỆNH VIỆN DA LIỄU HMS-VN</h2>
            <p className="text-[12px] text-[#707882]">
              Địa chỉ: 123 Đường Trần Phú, Quận 5, TP. Hồ Chí Minh · Tel: (028) 3824 5678
            </p>
            <p className="text-[12px] text-[#707882]">Mã CSKCB: 01DA00001 · Hạng II</p>
          </div>

          {/* Title */}
          <div className="text-center">
            <h3 className="text-[15px] font-bold text-[#006096] uppercase tracking-wide">
              BẢNG KÊ CHI PHÍ KHÁM CHỮA BỆNH
            </h3>
            <p className="text-[10.5px] text-[#707882]">
              Mẫu 01/KBCB — Ban hành theo QĐ 697/QĐ-BYT ngày 28/02/2022
            </p>
          </div>

          {/* Patient Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px] py-3 border-y border-[#bfc7d2]">
            <div>
              <strong>Họ và tên:</strong> <span className="text-[#707882]">{patient.fullName}</span>
            </div>
            <div>
              <strong>Ngày sinh:</strong> <span className="text-[#707882]">{patient.dob}</span>
            </div>
            <div>
              <strong>Mã BN:</strong>{' '}
              <span className="font-mono text-[#707882]">{patient.code}</span>
            </div>
            <div>
              <strong>Số thẻ BHYT:</strong>{' '}
              <span className="font-mono text-[#707882]">{patient.bhytCardNumber}</span>
            </div>
            <div>
              <strong>Ngày khám:</strong> <span className="text-[#707882]">20/07/2026</span>
            </div>
            <div>
              <strong>Tuyến BHYT:</strong> <span className="text-[#707882]">Đúng tuyến</span>
            </div>
            <div>
              <strong>Mức hưởng:</strong> <span className="text-[#707882]">80%</span>
            </div>
            <div>
              <strong>Chẩn đoán:</strong>{' '}
              <span className="text-[#707882]">Viêm da tiếp xúc dị ứng (L23.9)</span>
            </div>
          </div>

          {/* Fee Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11.5px] border border-[#bfc7d2]">
              <thead className="bg-[#cee5ff] text-[#006096] font-bold text-[11px]">
                <tr>
                  <th className="p-2 border border-[#bfc7d2]">Nhóm chi phí</th>
                  <th className="p-2 text-right border border-[#bfc7d2]">Tổng tiền</th>
                  <th className="p-2 text-right border border-[#bfc7d2]">BHYT chi trả</th>
                  <th className="p-2 text-right border border-[#bfc7d2]">BN tự trả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e9ed]">
                <tr>
                  <td className="p-2 border border-[#e4e9ed]">1. Tiền khám bệnh</td>
                  <td className="p-2 text-right font-mono border border-[#e4e9ed]">100.000 đ</td>
                  <td className="p-2 text-right font-mono text-[#1a7a4a] border border-[#e4e9ed]">
                    80.000 đ
                  </td>
                  <td className="p-2 text-right font-mono border border-[#e4e9ed]">20.000 đ</td>
                </tr>
                <tr>
                  <td className="p-2 border border-[#e4e9ed]">2. Xét nghiệm cận lâm sàng</td>
                  <td className="p-2 text-right font-mono border border-[#e4e9ed]">975.000 đ</td>
                  <td className="p-2 text-right font-mono text-[#1a7a4a] border border-[#e4e9ed]">
                    780.000 đ
                  </td>
                  <td className="p-2 text-right font-mono border border-[#e4e9ed]">195.000 đ</td>
                </tr>
                <tr>
                  <td className="p-2 border border-[#e4e9ed]">
                    3. Thuốc &amp; Sinh phẩm y tế (tự trả)
                  </td>
                  <td className="p-2 text-right font-mono border border-[#e4e9ed]">215.000 đ</td>
                  <td className="p-2 text-right font-mono text-[#707882] border border-[#e4e9ed]">
                    —
                  </td>
                  <td className="p-2 text-right font-mono border border-[#e4e9ed]">215.000 đ</td>
                </tr>
                <tr className="bg-[#cee5ff] font-bold text-[#006096]">
                  <td className="p-2 border border-[#bfc7d2]">Cộng tổng chi phí</td>
                  <td className="p-2 text-right font-mono border border-[#bfc7d2]">1.290.000 đ</td>
                  <td className="p-2 text-right font-mono border border-[#bfc7d2]">860.000 đ</td>
                  <td className="p-2 text-right font-mono border border-[#bfc7d2]">430.000 đ</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Final Amount Highlight Box */}
          <div className="p-3 bg-[#cee5ff] rounded-md flex items-center justify-between">
            <span className="text-[14px] font-bold text-[#006096]">
              Số tiền bệnh nhân phải thanh toán:
            </span>
            <span className="text-[20px] font-bold font-mono text-[#006096] tabular-nums">
              430.000 đ
            </span>
          </div>

          {/* Sign Boxes */}
          <div className="grid grid-cols-2 gap-8 pt-4 text-center text-[11.5px]">
            <div>
              <p className="text-[#707882] mb-6">Người lập bảng kê</p>
              {isSigned || isPaid ? (
                <div className="inline-block border-2 border-[#ba1a1a] rounded px-3 py-1 text-xs font-bold text-[#ba1a1a] tracking-wider uppercase mb-1">
                  Đã ký xác nhận
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSigned(true)}
                  className="px-3 py-1.5 border border-[#006096] text-[#006096] rounded-md text-xs font-semibold hover:bg-[#cee5ff] transition-colors"
                >
                  Xác nhận ký
                </button>
              )}
            </div>
            <div>
              <p className="text-[#707882] mb-6">Trưởng phòng Tài chính — Kế toán</p>
              <div className="font-semibold text-[#171c1f]">&nbsp;</div>
            </div>
          </div>
        </div>

        {/* Right Side: Control Panel matching lines 1216-1258 */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#bfc7d2] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-center">
            <div className="text-[12px] text-[#707882] mb-1">Số tiền cần thu</div>
            <div className="text-[32px] font-bold font-mono text-[#006096] leading-tight">
              {isPaid ? '0 đ' : '430.000 đ'}
            </div>
          </div>

          {/* Payment Actions Card */}
          <div className="bg-white rounded-xl border border-[#bfc7d2] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-3">
            <div className="text-[12px] font-bold text-[#707882] uppercase tracking-wider">
              Phương thức thanh toán
            </div>
            {isPaid ? (
              <div className="p-3 bg-[#d4f4e2] border border-[#a7f0c8] rounded-md text-center space-y-1">
                <div className="text-[12.5px] font-bold text-[#1a7a4a]">
                  Hóa đơn đã được thanh toán
                </div>
                <div className="text-[11px] text-[#1a7a4a]">Biên lai số #RCP-2026-0312</div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onOpenCashModal}
                  className="w-full py-3 bg-[#006096] text-white rounded-md font-bold text-[14px] hover:bg-[#004a75] transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={2} />
                    <circle cx="12" cy="12" r="2" strokeWidth={2} />
                  </svg>
                  Thanh toán Tiền mặt
                </button>

                <button
                  type="button"
                  onClick={onOpenMomoModal}
                  className="w-full py-3 bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white rounded-md font-bold text-[14px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  Quét mã QR Momo
                </button>
              </>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#bfc7d2] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-2">
            <div className="text-[12px] font-bold text-[#707882] uppercase tracking-wider mb-2">
              Hành động đặc biệt
            </div>
            <button
              type="button"
              onClick={onOpenCancelModal}
              className="w-full py-2 border border-[#ba1a1a] text-[#ba1a1a] rounded-md font-medium text-[12.5px] hover:bg-[#ffdad6]/40 transition-colors flex items-center justify-center gap-1.5"
            >
              Hủy hóa đơn
            </button>
            <button
              type="button"
              onClick={onOpenWriteoffModal}
              className="w-full py-2 border border-[#a05c00] text-[#a05c00] rounded-md font-medium text-[12.5px] hover:bg-[#fff8e1]/40 transition-colors flex items-center justify-center gap-1.5"
            >
              Miễn giảm thất thu (Cấp cứu)
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#bfc7d2] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-2">
            <div className="text-[12px] font-bold text-[#707882] uppercase tracking-wider mb-2">
              Kết xuất &amp; In ấn
            </div>
            <button
              type="button"
              onClick={() => {}}
              className="w-full py-2 border border-[#bfc7d2] bg-[#f8fafc] text-[#3f4851] rounded-md font-medium text-[12.5px] hover:bg-[#eaeef2] transition-colors flex items-center justify-center gap-1.5"
            >
              Xuất XML BHYT
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2 border border-[#006096] bg-[#cee5ff] text-[#006096] rounded-md font-bold text-[12.5px] hover:bg-[#b8daff] transition-colors flex items-center justify-center gap-1.5"
            >
              In bảng kê 01/KBCB
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
