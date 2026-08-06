'use client';

import { useState } from 'react';

interface RefundModalProps {
  isOpen: boolean;
  amount: number;
  patientName: string;
  patientCode: string;
  onClose: () => void;
  onConfirmRefund: (reason: string) => void;
}

/**
 * Xác nhận hoàn số dư tạm ứng sau khi đối soát hồ sơ nội trú.
 *
 * @param props - Số tiền, hồ sơ và callback mutation từ workspace.
 * @param props.isOpen - false thì modal không render.
 * @param props.amount - Số tiền nguyên VNĐ được parent lấy từ balance hiện tại.
 * @param props.patientName - Tên hiển thị để đối chiếu hồ sơ.
 * @param props.patientCode - Mã hồ sơ hiển thị để đối chiếu, không phải quyền xác thực.
 * @param props.onClose - Hủy xác nhận mà không thay đổi số dư.
 * @param props.onConfirmRefund - Nhận lý do hợp lệ để parent gọi API hoàn tạm ứng.
 * @remarks Lý do mặc định chỉ giúp thao tác nhanh và vẫn yêu cầu tối thiểu 10 ký tự. Backend là
 * nguồn quyết định số dư, quyền và kết quả mutation; success/error do parent phản hồi.
 */
export function RefundModal({
  isOpen,
  amount,
  patientName,
  patientCode,
  onClose,
  onConfirmRefund,
}: RefundModalProps) {
  const [reason, setReason] = useState<string>(
    'Hoàn trả tiền tạm ứng dư sau khi bệnh nhân xuất viện.',
  );

  if (!isOpen) return null;

  /** Kiểm tra lý do rồi phát callback hoàn ứng; không tự gọi API hay in phiếu. */
  const handleConfirm = () => {
    if (reason.trim().length < 10) return;
    onConfirmRefund(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171c1f]/55 backdrop-blur-[2px] p-4 font-sans select-none animate-fadeIn">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#bfc7d2] animate-modalIn">
        <div className="p-5 border-b border-[#e4e9ed] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#d4f4e2] text-[#1a7a4a] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[16px] text-[#171c1f]">Xác nhận hoàn trả tiền tạm ứng</h3>
            <p className="text-[12px] text-[#707882] mt-0.5">
              Bệnh nhân:{' '}
              <strong className="text-[#171c1f]">
                {patientName} ({patientCode})
              </strong>
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-[#d4f4e2] rounded-xl p-4 text-center border border-[#a7f0c8]">
            <div className="text-[12px] text-[#1a7a4a] font-semibold mb-1">
              Số tiền bệnh viện hoàn trả
            </div>
            <div className="text-[32px] font-extrabold font-mono text-[#1a7a4a] leading-tight">
              {amount.toLocaleString('vi-VN')} đ
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#707882] mb-1">
              Lý do hoàn trả * (tối thiểu 10 ký tự)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-[#bfc7d2] rounded-md text-[13.5px] text-[#171c1f] outline-none transition-all duration-150 focus:border-[#1a7a4a] focus:ring-2 focus:ring-[#1a7a4a]/15"
            />
          </div>
        </div>

        <div className="p-4 bg-[#f8fafc] border-t border-[#e4e9ed] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#bfc7d2] bg-white rounded-md text-[13px] font-medium text-[#707882] hover:bg-[#f0f4f8] hover:text-[#171c1f] active:scale-[0.97] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-1"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={reason.trim().length < 10}
            onClick={handleConfirm}
            className="px-4 py-2 bg-[#1a7a4a] text-white rounded-md text-[13px] font-bold hover:bg-[#145c38] active:scale-[0.97] transition-all duration-200 ease-out shadow-[0_2px_8px_rgba(26,122,74,0.24)] hover:shadow-[0_4px_14px_rgba(26,122,74,0.3)] disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-1"
          >
            Xác nhận hoàn trả &amp; In phiếu
          </button>
        </div>
      </div>
    </div>
  );
}
