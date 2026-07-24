'use client';

import { useEffect, useState } from 'react';

import { AccountingWorkspaceView } from './accounting-workspace-view';

/**
 * Gate client-only: tránh hydration mismatch khi extension trình duyệt
 * chèn attribute (vd. fdprocessedid) vào <button> trước khi React hydrate.
 */
export function AccountingWorkspacePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="flex h-screen w-full items-center justify-center bg-[#f6fafe] text-sm font-medium text-[#707882]"
        suppressHydrationWarning
      >
        Đang tải màn hình kế toán...
      </div>
    );
  }

  return <AccountingWorkspaceView />;
}
