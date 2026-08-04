'use client';

type AppToastProps = {
  centered?: boolean;
  message: string | null;
  tone?: 'success' | 'error';
};

/**
 * Hiển thị thông báo thao tác ở dạng toast hoặc popup căn giữa tùy ngữ cảnh sử dụng.
 */
export function AppToast({ centered = false, message, tone = 'success' }: AppToastProps) {
  if (!message) {
    return null;
  }

  const isSuccess = tone === 'success';
  const wrapperClass = centered
    ? 'fixed inset-0 z-[100] flex items-center justify-center bg-[#0d293c]/20 px-4'
    : 'fixed bottom-6 right-6 z-[100] flex max-w-md items-center px-5 py-3';
  const cardClass = centered
    ? `flex w-full max-w-[520px] items-start gap-3 rounded-[14px] border bg-white px-5 py-4 text-[#171c1f] shadow-[0_18px_45px_rgba(13,41,60,0.2)] ${
        isSuccess ? 'border-[#96ccff]' : 'border-[#ffcdd2]'
      }`
    : `flex max-w-md items-center gap-3 rounded-xl text-sm font-semibold text-white shadow-2xl ${
        isSuccess
          ? 'border border-emerald-700/40 bg-slate-900'
          : 'border border-red-700/40 bg-slate-900'
      }`;

  return (
    <div className={wrapperClass}>
      <div className={cardClass} role={isSuccess ? 'status' : 'alert'}>
        <span
          aria-hidden="true"
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
            centered
              ? isSuccess
                ? 'bg-[#cee5ff] text-[#006096]'
                : 'bg-[#fff0ef] text-[#ba1a1a]'
              : isSuccess
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
          }`}
        >
          {isSuccess ? 'OK' : '!'}
        </span>
        <span className="leading-snug">{message}</span>
      </div>
    </div>
  );
}
