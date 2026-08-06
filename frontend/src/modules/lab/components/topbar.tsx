'use client';

import { useEffect, useState } from 'react';

import { labWorkspaceStyles as styles } from '../pages/workspace/lab-workspace.styles';

/** Tiêu đề theo màn hình; key lạ dùng fallback `Quản lý xét nghiệm` khi render. */
const SCREEN_TITLE: Record<string, string> = {
  queue: 'Hàng Đợi Chỉ Định Xét Nghiệm',
  'result-entry': 'Nhập Chi Tiết Kết Quả Xét Nghiệm',
  history: 'Lịch Sử & Tra Cứu Kết Quả',
  config: 'Cấu Hình & Thống Kê Hoạt Động',
};

interface TopbarProps {
  screen: string;
}

/** Định dạng đồng hồ hiển thị theo locale Việt Nam, gồm giờ/phút và ngày trong tuần. */
function formatClock(now: Date): string {
  const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${time} — ${date}`;
}

/** Hiển thị ngữ cảnh màn hình xét nghiệm và đồng hồ cục bộ cho workspace. */
export function Topbar({ screen }: TopbarProps) {
  const [now, setNow] = useState<Date | null>(null);

  // Đồng bộ đồng hồ với thời gian trình duyệt mỗi phút; cleanup timer khi unmount để tránh rò rỉ.
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className={styles.topbar}>
      <h1 className={styles.topbarTitle}>{SCREEN_TITLE[screen] ?? 'Quản lý xét nghiệm'}</h1>
      <div className={styles.netBadge} role="status">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1b6e3f]" />
        Đồng bộ thời gian thực{now ? ` · ${formatClock(now)}` : ''}
      </div>
    </header>
  );
}
