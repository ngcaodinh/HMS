'use client';

import { useState } from 'react';

interface WriteoffModalProps {
  isOpen: boolean;
  invoiceNumber: string;
  onClose: () => void;
  onConfirmWriteoff: (reason: string) => void;
}

export function WriteoffModal({
  isOpen,
  invoiceNumber,
  onClose,
  onConfirmWriteoff,
}: WriteoffModalProps) {
  const [reason, setReason] = useState<string>('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (reason.trim().length < 10) return;
    onConfirmWriteoff(reason);
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171c1f]/55 backdrop-blur-[2px] p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#bfc7d2] animate-in zoom-in-95 duration-200">
        {/* Header matching lines 1680-1690 */}
        <div className="p-5 border-b border-[#e4e9ed] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#fff8e1] text-[#a05c00] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[16px] text-[#171c1f]">
              Miễn giảm thất thu (Write-off Cấp cứu)
            </h3>
            <p className="text-[12px] text-[#707882] mt-0.5">
              Áp dụng cho ca cấp cứu đặc biệt không thu được viện phí ({invoiceNumber})
            </p>
          </div>
        </div>

        {/* Body matching lines 1691-1700 */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-[#fff8e1] text-[#a05c00] border border-[#fcd9a0] rounded-lg text-[13px] flex items-start gap-2.5 leading-relaxed">
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
              Hóa đơn sẽ được ghi nhận thất thu (write_off). Số tiền sẽ chuyển vào mục Báo cáo Miễn
              giảm / Thất thu của bệnh viện.
            </span>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#707882] mb-1">
              Lý do miễn giảm * (tối thiểu 10 ký tự)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do chi tiết: Bệnh nhân vô danh, không có thân nhân đến nhận, tử vong..."
              className="w-full p-3 border border-[#bfc7d2] rounded-md text-[13.5px] text-[#171c1f] outline-none focus:border-[#a05c00]"
            />
          </div>
        </div>

        {/* Footer matching lines 1701-1705 */}
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
            disabled={reason.trim().length < 10}
            onClick={handleConfirm}
            className="px-4 py-2 border border-[#a05c00] text-[#a05c00] rounded-md text-[13px] font-bold hover:bg-[#fff8e1] transition-colors disabled:opacity-50"
          >
            Duyệt Write-off Cấp cứu
          </button>
        </div>
      </div>
    </div>
  );
}
