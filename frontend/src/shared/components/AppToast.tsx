'use client';

import { useEffect } from 'react';

type AppToastProps = {
  /** Chọn biến thể modal căn giữa; mặc định là toast ở góc dưới bên phải. */
  centered?: boolean;
  /** Nội dung thông báo; truyền `null` để không render gì. */
  message: string | null;
  /**
   * Callback khi người dùng chủ động đóng thông báo bằng nút X, Escape hoặc lớp phủ modal.
   * Không truyền callback nếu thông báo không cần thao tác đóng thủ công.
   */
  onClose?: () => void;
  /** Sắc thái hiển thị và ngữ nghĩa trợ năng: `success` hoặc `error`, mặc định là `success`. */
  tone?: 'success' | 'error';
};

/**
 * Biểu tượng dấu X dùng cho nút đóng popup (SVG nét mảnh, đồng bộ với các modal khác trong hệ thống).
 *
 * @param className Class Tailwind tùy chỉnh cho SVG; mặc định là kích thước 16px.
 */
function CloseIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </svg>
  );
}

/**
 * Biểu tượng thành công dạng khiên, dùng trong các thông báo của HMS.
 *
 * @param className Class Tailwind tùy chỉnh cho SVG; mặc định là kích thước 28px.
 */
export function MedicalSuccessBadge({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.01a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.74-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}
/**
 * Biểu tượng lỗi dạng khiên, dùng trong các thông báo của HMS.
 *
 * @param className Class Tailwind tùy chỉnh cho SVG; mặc định là kích thước 28px.
 */
export function MedicalErrorBadge({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
        clipRule="evenodd"
      />
    </svg>
  );
}
/**
 * Hiển thị thông báo thành công hoặc lỗi ở dạng modal căn giữa hoặc toast góc màn hình.
 *
 * @param props Các thuộc tính điều khiển vị trí, nội dung, sắc thái và callback đóng.
 * @param props.centered Khi `true`, hiển thị lớp phủ modal; mặc định là `false`.
 * @param props.message Nội dung cần hiển thị; `null` tạo trạng thái ẩn.
 * @param props.onClose Callback đóng thủ công; không có callback thì không có nút đóng.
 * @param props.tone Sắc thái `success` hoặc `error`, đồng thời chọn vai trò ARIA tương ứng.
 * @returns `null` khi không có message; ngược lại trả về modal hoặc toast theo `centered`.
 * @remarks Component không tự quản lý thời gian tự ẩn; `useAppToast` sở hữu lifecycle đó.
 * Khi là modal, component lắng nghe Escape và click trên lớp phủ, đồng thời dọn listener khi
 * thông báo ẩn hoặc callback thay đổi. Quyền hiển thị phải được quyết định ở caller/backend.
 */
export function AppToast({ centered = false, message, onClose, tone = 'success' }: AppToastProps) {
  // Đồng bộ listener Escape khi message/centered/onClose thay đổi; cleanup để không giữ callback cũ.
  useEffect(() => {
    if (!message || !centered || !onClose) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose?.();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [message, centered, onClose]);

  if (!message) {
    return null;
  }

  const isSuccess = tone === 'success';

  if (centered) {
    // Tách phần chi tiết sau dấu phân cách để giữ thông báo chính dễ đọc, không suy diễn nội dung.
    const parts = message.split(' · ');
    const mainMessage = parts[0];
    const details = parts.slice(1);

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d293c]/40 px-4 backdrop-blur-md transition-all duration-300 animate-fadeIn"
        onClick={(event) => {
          // Chỉ đóng khi bấm đúng vào lớp phủ nền, không đóng khi bấm vào nội dung card
          if (onClose && event.target === event.currentTarget) onClose();
        }}
      >
        <div
          aria-live="polite"
          className={`relative flex w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border-2 bg-white text-[#171c1f] transition-all duration-200 animate-modalIn ${
            isSuccess
              ? 'border-[#96ccff] shadow-[0_25px_60px_-15px_rgba(0,96,150,0.3)]'
              : 'border-[#ffcdd2] shadow-[0_25px_60px_-15px_rgba(198,40,40,0.3)]'
          }`}
          role={isSuccess ? 'status' : 'alert'}
        >
          <div
            className={`flex items-center justify-between px-5 py-3.5 text-white ${
              isSuccess
                ? 'bg-gradient-to-r from-[#004a75] via-[#006096] to-[#007abc]'
                : 'bg-gradient-to-r from-[#800000] via-[#c62828] to-[#e53935]'
            }`}
          >
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
              {isSuccess ? 'THÔNG BÁO' : 'CẢNH BÁO'}
            </span>
            {onClose ? (
              <button
                aria-label="Đóng thông báo"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 transition-colors duration-150 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                onClick={onClose}
                type="button"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          <div className="flex items-start gap-4 bg-white p-6">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-4 ${
                isSuccess
                  ? 'bg-gradient-to-br from-[#cee5ff] to-[#96ccff]/60 text-[#006096] ring-[#cee5ff]/50 shadow-[0_4px_14px_rgba(0,96,150,0.25)]'
                  : 'bg-gradient-to-br from-[#fff0ef] to-[#ffcdd2]/60 text-[#c62828] ring-[#fff0ef]/50 shadow-[0_4px_14px_rgba(198,40,40,0.25)]'
              }`}
            >
              {isSuccess ? <MedicalSuccessBadge className="h-8 w-8" /> : <MedicalErrorBadge className="h-8 w-8" />}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <h4 className="text-[15px] font-bold leading-snug text-[#171c1f]">
                {mainMessage}
              </h4>

              {details.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {details.map((item, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-bold shadow-xs ${
                        isSuccess
                          ? 'border-[#96ccff] bg-[#f0f7fd] text-[#006096]'
                          : 'border-[#ffcdd2] bg-[#fff5f5] text-[#c62828]'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex max-w-md items-center px-4 py-2 transition-all duration-200 animate-toastSlideIn">
      <div
        aria-live="polite"
        className={`flex max-w-md items-center gap-3.5 rounded-xl border px-4 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur-md ${
          isSuccess
            ? 'border-[#006096]/50 bg-[#0d293c]/95 text-white'
            : 'border-[#c62828]/50 bg-[#2b0000]/95 text-white'
        }`}
        role={isSuccess ? 'status' : 'alert'}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            isSuccess ? 'bg-[#55d7ed]/20 text-[#55d7ed]' : 'bg-[#ffcdd2]/20 text-[#ffcdd2]'
          }`}
        >
          {isSuccess ? <MedicalSuccessBadge className="h-5 w-5" /> : <MedicalErrorBadge className="h-5 w-5" />}
        </div>
        <span className="flex-1 leading-snug text-white/95">{message}</span>
        {onClose ? (
          <button
            aria-label="Đóng thông báo"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            onClick={onClose}
            type="button"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
