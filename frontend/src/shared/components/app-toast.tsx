'use client';

type AppToastProps = {
  message: string | null;
  tone?: 'success' | 'error';
};

/**
 * Toast goc man hinh - thong bao luu thanh cong / loi.
 */
export function AppToast({ message, tone = 'success' }: AppToastProps) {
  if (!message) {
    return null;
  }

  const isSuccess = tone === 'success';

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex max-w-md items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-2xl ${
        isSuccess
          ? 'border border-emerald-700/40 bg-slate-900'
          : 'border border-red-700/40 bg-slate-900'
      }`}
      role="status"
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
          isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        }`}
      >
        {isSuccess ? 'OK' : '!'}
      </span>
      <span className="leading-snug">{message}</span>
    </div>
  );
}
