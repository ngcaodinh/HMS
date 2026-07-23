'use client';

import { useState } from 'react';

interface CancelInvoiceModalProps {
  isOpen: boolean;
  invoiceNumber: string;
  onClose: () => void;
  onConfirmCancel: (reason: string) => void;
}

export function CancelInvoiceModal({
  isOpen,
  invoiceNumber,
  onClose,
  onConfirmCancel,
}: CancelInvoiceModalProps) {
  const [reason, setReason] = useState<string>('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (reason.trim().length < 10) return;
    onConfirmCancel(reason);
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171c1f]/55 backdrop-blur-[2px] p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#bfc7d2] animate-in zoom-in-95 duration-200">
        {/* Header matching lines 1651-1661 */}
        <div className="p-5 border-b border-[#e4e9ed] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeWidth={2} />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[16px] text-[#171c1f]">Hủy hóa đơn viện phí</h3>
            <p className="text-[12px] text-[#707882] mt-0.5">
              Hóa đơn <span className="font-mono font-bold text-[#006096]">{invoiceNumber}</span> sẽ
              chuyển sang trạng thái Đã hủy
            </p>
          </div>
        </div>

        {/* Body matching lines 1662-1671 */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-[#ffdad6] text-[#ba1a1a] border border-[#f5c6c6] rounded-lg text-[13px] flex items-start gap-2.5 leading-relaxed">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              Thao tác hủy sẽ giải phóng các chỉ định để bác sĩ có thể chỉnh sửa. Hệ thống không xóa
              cứng bản ghi khỏi CSDL.
            </span>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#707882] mb-1">
              Lý do hủy hóa đơn * (tối thiểu 10 ký tự)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do hủy chi tiết, tối thiểu 10 ký tự..."
              className="w-full p-3 border border-[#bfc7d2] rounded-md text-[13.5px] text-[#171c1f] outline-none focus:border-[#ba1a1a]"
            />
          </div>
        </div>

        {/* Footer matching lines 1672-1675 */}
        <div className="p-4 bg-[#f8fafc] border-t border-[#e4e9ed] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#bfc7d2] bg-white rounded-md text-[13px] font-medium text-[#707882] hover:bg-[#f0f4f8] transition-colors"
          >
            Giữ lại
          </button>
          <button
            type="button"
            disabled={reason.trim().length < 10}
            onClick={handleConfirm}
            className="px-4 py-2 bg-[#ba1a1a] text-white rounded-md text-[13px] font-bold hover:bg-[#93000a] transition-colors disabled:opacity-50"
          >
            Xác nhận hủy hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
}
