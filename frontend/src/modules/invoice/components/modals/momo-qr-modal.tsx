'use client';

import { useEffect, useState } from 'react';

interface MomoQrModalProps {
  isOpen: boolean;
  amount: number;
  invoiceNumber: string;
  patientName: string;
  onClose: () => void;
  onConfirmSuccess: () => void;
}

export function MomoQrModal({
  isOpen,
  amount,
  invoiceNumber,
  patientName,
  onClose,
  onConfirmSuccess,
}: MomoQrModalProps) {
  const [timeLeft, setTimeLeft] = useState<number>(300);

  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(300);
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171c1f]/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden font-sans space-y-4 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e4e9ed] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-[#f5d0fe] text-[#a21caf] font-bold rounded-lg flex items-center justify-center text-xs">
              MoMo
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#171c1f]">Thanh toán qua Ví MoMo QR</h3>
              <p className="text-xs text-[#707882]">
                Hóa đơn: <span className="font-mono font-bold text-[#006096]">{invoiceNumber}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#707882] hover:bg-[#f0f4f8] hover:text-[#171c1f]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="bg-gradient-to-r from-purple-800 via-fuchsia-700 to-pink-600 rounded-xl p-6 text-center text-white space-y-4 shadow-inner">
            <div className="text-xs font-semibold text-white/90">Số tiền cần thanh toán</div>
            <div className="text-3xl font-extrabold font-mono text-white tabular-nums">
              {amount.toLocaleString('vi-VN')} đ
            </div>

            {/* QR SVG */}
            <div className="w-36 h-36 bg-white rounded-xl mx-auto p-2 flex items-center justify-center shadow-lg">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" fill="white" />
                <rect x="8" y="8" width="28" height="28" fill="#A50064" />
                <rect x="14" y="14" width="16" height="16" fill="white" />
                <rect x="18" y="18" width="8" height="8" fill="#A50064" />

                <rect x="64" y="8" width="28" height="28" fill="#A50064" />
                <rect x="70" y="14" width="16" height="16" fill="white" />
                <rect x="74" y="18" width="8" height="8" fill="#A50064" />

                <rect x="8" y="64" width="28" height="28" fill="#A50064" />
                <rect x="14" y="70" width="16" height="16" fill="white" />
                <rect x="18" y="74" width="8" height="8" fill="#A50064" />

                <rect x="42" y="42" width="16" height="16" rx="3" fill="#A50064" />
                <circle cx="50" cy="50" r="4" fill="white" />

                <rect x="44" y="12" width="12" height="24" fill="#171c1f" />
                <rect x="12" y="44" width="24" height="12" fill="#171c1f" />
                <rect x="64" y="44" width="24" height="12" fill="#171c1f" />
                <rect x="44" y="68" width="12" height="20" fill="#171c1f" />
              </svg>
            </div>

            <div className="text-xs text-white/90">
              Bệnh nhân: <strong>{patientName}</strong>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#3f4851] bg-[#f0f4f8] p-3 rounded-lg border border-[#e4e9ed]">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-[#bfc7d2] border-t-[#006096] animate-spin" />
              Đang chờ quét mã...
            </span>
            <span className="font-mono font-bold text-[#ba1a1a]">
              Mã hết hạn trong: {timeFormatted}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f0f4f8] border-t border-[#e4e9ed] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#bfc7d2] rounded-xl text-xs font-semibold text-[#3f4851] hover:bg-white"
          >
            Hủy giao dịch
          </button>
          <button
            type="button"
            onClick={onConfirmSuccess}
            className="flex-1 py-2.5 bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-md"
          >
            Xác nhận đã thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}
