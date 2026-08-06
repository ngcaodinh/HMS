import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

interface TopbarProps {
  pharmacistName: string;
}

/** Hiển thị người dùng và thời điểm hiện tại trong workspace cấp phát thuốc. */
export function Topbar({ pharmacistName }: TopbarProps) {
  const now = new Date();

  return (
    <header className={styles.topbar}>
      <div className="flex min-w-0 items-center gap-3">
        <h1 className={styles.topbarTitle}>
          <strong>Dược sĩ</strong> · Cấp phát thuốc theo đơn – HMS-VN
        </h1>
        <span className={styles.netBadge} role="status">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1b6e3f]" />
          Online
        </span>
      </div>
      <div className={styles.topbarRight}>
        <div>
          <p className={styles.topbarUserName}>{pharmacistName}</p>
          <p className={styles.topbarUserRole}>Dược sĩ · Khoa Dược</p>
        </div>
        <span className={styles.dutyPill}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#1b6e3f]" />
          Đang trực
        </span>
        <div className="h-6 w-px bg-[#bfc7d2]" />
        <div>
          <p className={styles.topbarTimeStrong}>
            {now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
          <p className={styles.topbarTime}>{now.toLocaleTimeString('vi-VN')} ICT</p>
        </div>
      </div>
    </header>
  );
}
