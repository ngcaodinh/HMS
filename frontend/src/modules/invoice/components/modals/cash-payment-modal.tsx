'use client';

import { useState } from 'react';

interface CashPaymentModalProps {
  isOpen: boolean;
  /** Số tiền hiển thị — number view hoặc parse từ money string. */
  amount: number;
  invoiceNumber: string;
  patientName: string;
  onClose: () => void;
  onConfirmSuccess: () => void | Promise<void>;
  isSubmitting?: boolean;
}

export function CashPaymentModal({
  isOpen,
  amount,
  invoiceNumber,
  patientName,
  onClose,
  onConfirmSuccess,
  isSubmitting = false,
}: CashPaymentModalProps) {
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (busy || isSubmitting) {
      return;
    }
    setBusy(true);
    try {
      await onConfirmSuccess();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171c1f]/55 backdrop-blur-[2px] p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#bfc7d2] animate-in zoom-in-95 duration-200">
        {/* Header matching lines 1560-1568 */}
        <div className="p-5 border-b border-[#e4e9ed] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#cee5ff] text-[#006096] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={2} />
              <circle cx="12" cy="12" r="2" strokeWidth={2} />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[16px] text-[#171c1f]">Xác nhận thu tiền mặt</h3>
            <p className="text-[12px] text-[#707882] mt-0.5">
              Hóa đơn <span className="font-mono font-bold text-[#006096]">{invoiceNumber}</span> ·
              Bệnh nhân: <strong className="text-[#171c1f]">{patientName}</strong>
            </p>
          </div>
        </div>

        {/* Body matching lines 1569-1578 */}
        <div className="p-5 space-y-4">
          <div className="bg-[#cee5ff] rounded-xl p-4 text-center">
            <div className="text-[12px] text-[#707882] font-semibold mb-1">Số tiền cần thu</div>
            <div className="text-[32px] font-extrabold font-mono text-[#006096] leading-tight">
              {amount.toLocaleString('vi-VN')} đ
            </div>
          </div>

          <div className="p-3 bg-[#e3f2fd] text-[#1565c0] border border-[#bfdbfe] rounded-lg text-[13px] flex items-start gap-2.5 leading-relaxed">
            <svg
              className="w-4 h-4 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Vui lòng kiểm tra kỹ số tiền mặt nhận từ bệnh nhân trước khi xác nhận. Hành động này
              không thể hoàn tác.
            </span>
          </div>
        </div>

        {/* Footer matching lines 1579-1585 */}
        <div className="p-4 bg-[#f8fafc] border-t border-[#e4e9ed] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#bfc7d2] bg-white rounded-md text-[13px] font-medium text-[#707882] hover:bg-[#f0f4f8] transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={busy || isSubmitting}
            onClick={() => {
              void handleConfirm();
            }}
            className="px-4 py-2 bg-[#006096] text-white rounded-md text-[13px] font-bold hover:bg-[#004a75] transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Xác nhận đã thu tiền
          </button>
        </div>
      </div>
    </div>
  );
}
