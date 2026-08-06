'use client';

import { useEffect, useState } from 'react';

import { AccountingWorkspaceView } from './AccountingWorkspaceView';

/**
 * Khởi tạo page kế toán sau khi client mount để tránh hydration mismatch do extension trình duyệt.
 *
 * @remarks Trạng thái loading hiển thị placeholder cho tới khi mounted, sau đó render
 * AccountingWorkspaceView để quản lý lookup, payment, tạm ứng và report. Page không tự kiểm tra
 * quyền hoặc tải dữ liệu; access boundary và authorization vẫn do middleware/backend bảo đảm.
 */
export function AccountingWorkspacePage() {
  const [mounted, setMounted] = useState(false);

  // Chỉ đánh dấu client mount; effect không gọi API và không cần cleanup.
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
