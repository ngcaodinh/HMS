import type { ReactNode } from 'react';

type AdminModalProps = {
  children: ReactNode;
  description?: string;
  maxWidthClassName?: string;
  onClose: () => void;
  title: string;
  titleId: string;
};

/**
 * Khung modal dùng chung cho module Admin, đồng bộ chính xác phong cách `.ktv-modal` của trang
 * KTV IT (overlay mờ nền + card bo góc 16px + nút đóng tròn góc phải + animation vào modal).
 * @param titleId - id gắn cho tiêu đề, dùng cho `aria-labelledby` để hỗ trợ trình đọc màn hình.
 */
export function AdminModal({
  children,
  description,
  maxWidthClassName = 'max-w-[520px]',
  onClose,
  title,
  titleId,
}: AdminModalProps) {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/45 p-5 backdrop-blur-[3px] animate-fadeIn"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={`relative max-h-[calc(100vh-40px)] w-full ${maxWidthClassName} overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(0,96,150,0.13),0_1px_4px_rgba(0,0,0,0.06)] animate-modalIn`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Đóng"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#f0f4f8] text-sm font-semibold text-[#707882] transition hover:bg-[#e4e9ed]"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>
        <div className="mb-1 text-base font-bold text-[#171c1f]" id={titleId}>
          {title}
        </div>
        {description ? <div className="mb-5 text-xs text-[#707882]">{description}</div> : null}
        {children}
      </div>
    </div>
  );
}
