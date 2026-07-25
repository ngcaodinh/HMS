'use client';

import type { ReactNode } from 'react';
import { useId, useState } from 'react';

import { performLogout } from './logout';

type LogoutButtonProps = {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  title?: string;
};

/**
 * Button đăng xuất dùng chung cho các sidebar HMS, mở popup xác nhận trước khi kết thúc phiên.
 */
export function LogoutButton({
  ariaLabel = 'Đăng xuất',
  children,
  className,
  title,
}: LogoutButtonProps) {
  const titleId = useId();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /** Xác nhận logout một lần, tránh người dùng bấm lặp trong lúc xóa session. */
  const handleConfirmLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await performLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <button
        aria-label={ariaLabel}
        className={className}
        onClick={() => setIsConfirmOpen(true)}
        title={title}
        type="button"
      >
        {children}
      </button>

      {isConfirmOpen ? (
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
        >
          <div className="w-full max-w-[380px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M16 17l5-5m0 0-5-5m5 5H9m4 5v1.5A1.5 1.5 0 0 1 11.5 20h-6A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4h6A1.5 1.5 0 0 1 13 5.5V7"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-6 text-slate-950" id={titleId}>
                  Đăng xuất hệ thống
                </h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Bạn có chắc muốn kết thúc phiên làm việc hiện tại?
                </p>
              </div>
            </div>

            <div className="px-5 py-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-5 text-amber-800">
                Hãy đảm bảo các thao tác đang nhập liệu đã được lưu trước khi đăng xuất.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-700/10"
                disabled={isLoggingOut}
                onClick={() => setIsConfirmOpen(false)}
                type="button"
              >
                Ở lại
              </button>
              <button
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-700/20 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isLoggingOut}
                onClick={() => {
                  void handleConfirmLogout();
                }}
                type="button"
              >
                {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
