'use client';

import { useEffect, useMemo, useState } from 'react';

interface MomoQrModalProps {
  isOpen: boolean;
  amount: number;
  invoiceNumber: string;
  patientName: string;
  onClose: () => void;
  onConfirmSuccess: () => void | Promise<void>;
  /** payUrl — mở cổng Momo trên trình duyệt (giữ nguyên luồng redirect cũ). */
  payUrl?: string | null;
  /**
   * Payload gen QR từ API (Momo `qrCodeUrl`, hoặc fallback `payUrl`).
   * Không phải URL ảnh — FE encode thành QR.
   */
  qrPayload?: string | null;
  statusText?: string;
}

/**
 * Build URL ảnh QR từ payload (không thêm dependency npm).
 * Dùng qrserver CDN chỉ để render ảnh; payload vẫn đến từ BE/Momo.
 */
function buildQrImageUrl(payload: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(payload)}`;
}

export function MomoQrModal({
  isOpen,
  amount,
  invoiceNumber,
  patientName,
  onClose,
  onConfirmSuccess,
  payUrl = null,
  qrPayload = null,
  statusText,
}: MomoQrModalProps) {
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [busy, setBusy] = useState(false);
  const [qrImageFailed, setQrImageFailed] = useState(false);

  const effectivePayload = useMemo(() => {
    const fromQr = qrPayload?.trim() ?? '';
    if (fromQr.length > 0) {
      return fromQr;
    }
    const fromPay = payUrl?.trim() ?? '';
    return fromPay.length > 0 ? fromPay : null;
  }, [qrPayload, payUrl]);

  const qrImageSrc = useMemo(
    () => (effectivePayload ? buildQrImageUrl(effectivePayload, 200) : null),
    [effectivePayload],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTimeLeft(300);
    setQrImageFailed(false);
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, effectivePayload]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await onConfirmSuccess();
    } finally {
      setBusy(false);
    }
  };

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

            {/* QR thật từ payload Momo */}
            <div className="w-44 h-44 bg-white rounded-xl mx-auto p-2 flex items-center justify-center shadow-lg">
              {qrImageSrc && !qrImageFailed ? (
                // eslint-disable-next-line @next/next/no-img-element -- external QR render URL, no next/image domain config
                <img
                  src={qrImageSrc}
                  alt="Mã QR thanh toán MoMo"
                  width={200}
                  height={200}
                  className="w-full h-full object-contain"
                  onError={() => setQrImageFailed(true)}
                />
              ) : (
                <div className="text-[11px] text-[#3f4851] px-2 text-center space-y-1">
                  <p className="font-semibold">Không tải được ảnh QR</p>
                  <p>Dùng nút mở trang thanh toán bên dưới.</p>
                </div>
              )}
            </div>

            <div className="text-xs text-white/90">
              Bệnh nhân: <strong>{patientName}</strong>
            </div>
            <p className="text-[11px] text-white/80 leading-snug px-2">
              Mở app MoMo Test → Quét mã QR trên màn hình. Hoặc mở trang thanh toán Momo trên
              trình duyệt.
            </p>
            {payUrl ? (
              <a
                className="inline-block text-xs font-bold underline text-white"
                href={payUrl}
                rel="noreferrer"
                target="_blank"
              >
                Mở trang thanh toán Momo
              </a>
            ) : null}
          </div>

          <div className="flex items-center justify-between text-xs text-[#3f4851] bg-[#f0f4f8] p-3 rounded-lg border border-[#e4e9ed]">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-[#bfc7d2] border-t-[#006096] animate-spin" />
              {statusText ?? 'Đang chờ thanh toán / IPN...'}
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
            disabled={busy}
            onClick={() => {
              void handleConfirm();
            }}
            className="flex-1 py-2.5 bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-md disabled:opacity-60"
          >
            {busy ? 'Đang xử lý…' : 'Đồng bộ / xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
