'use client';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
}

export function LogoutModal({ isOpen, onClose, onConfirmLogout }: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171c1f]/55 backdrop-blur-[2px] p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#bfc7d2] animate-in zoom-in-95 duration-200">
        {/* Header matching lines 1740-1751 */}
        <div className="p-5 border-b border-[#e4e9ed] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[16px] text-[#171c1f]">Đăng xuất hệ thống</h3>
            <p className="text-[12px] text-[#707882] mt-0.5">Bạn có chắc muốn kết thúc ca trực?</p>
          </div>
        </div>

        {/* Body matching lines 1752-1757 */}
        <div className="p-5">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Vui lòng đảm bảo đã hoàn tất tất cả giao dịch trong ca trước khi đăng xuất.</span>
          </div>
        </div>

        {/* Footer matching lines 1758-1761 */}
        <div className="p-4 bg-[#f8fafc] border-t border-[#e4e9ed] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#bfc7d2] bg-white rounded-md text-[13px] font-medium text-[#707882] hover:bg-[#f0f4f8] transition-colors"
          >
            Ở lại
          </button>
          <button
            type="button"
            onClick={onConfirmLogout}
            className="px-4 py-2 bg-[#ba1a1a] text-white rounded-md text-[13px] font-bold hover:bg-[#93000a] transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
