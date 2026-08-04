import Image from 'next/image';

import { labWorkspaceStyles as styles } from '../pages/workspace/lab-workspace.styles';
import { AssetIcon, cn } from './shared';

export type LabScreen = 'queue' | 'result-entry' | 'history' | 'config';

interface SidebarProps {
  onChangeScreen: (screen: LabScreen) => void;
  onLogout: () => void;
  pendingCount: number;
  screen: LabScreen;
  technicianName: string;
}

const LAB_NAV_ITEMS: Array<{ icon: string; id: LabScreen; label: string }> = [
  { id: 'queue', icon: 'icon-lab-order.svg', label: 'Hàng đợi xét nghiệm' },
  { id: 'result-entry', icon: 'icon-save.svg', label: 'Nhập kết quả' },
  { id: 'history', icon: 'icon-lab-result.svg', label: 'Lịch sử & Tra cứu' },
];

const MANAGE_NAV_ITEMS: Array<{ icon: string; id: LabScreen; label: string }> = [
  { id: 'config', icon: 'icon-icd.svg', label: 'Cấu hình & Thống kê' },
];

export function Sidebar({ onChangeScreen, onLogout, pendingCount, screen, technicianName }: SidebarProps) {
  const initial = technicianName.trim().charAt(0).toUpperCase() || 'K';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logoWrap}>
          <Image alt="HMS-VN" className="h-full w-full object-cover" height={34} priority src="/hms-login-logo.png" width={34} />
        </div>
        <div className="min-w-0">
          <p className={styles.brandName}>HMS-VN</p>
          <p className={styles.brandSubtitle}>Hệ thống quản lý bệnh viện</p>
        </div>
      </div>

      <nav className={styles.navSection}>
        <p className={styles.navSectionLabel}>Xét nghiệm</p>
        {LAB_NAV_ITEMS.map((item) => (
          <button
            className={cn(styles.navItem, screen === item.id && styles.navItemActive)}
            key={item.id}
            onClick={() => onChangeScreen(item.id)}
            type="button"
          >
            <AssetIcon
              className={cn(
                'h-4 w-4 brightness-0 invert transition-opacity duration-200',
                screen === item.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-75',
              )}
              name={item.icon}
            />
            {item.label}
            {item.id === 'queue' && pendingCount > 0 && <span className={styles.navBadge}>{pendingCount}</span>}
          </button>
        ))}

        <p className={cn(styles.navSectionLabel, 'mt-4')}>Quản lý</p>
        {MANAGE_NAV_ITEMS.map((item) => (
          <button
            className={cn(styles.navItem, screen === item.id && styles.navItemActive)}
            key={item.id}
            onClick={() => onChangeScreen(item.id)}
            type="button"
          >
            <AssetIcon
              className={cn(
                'h-4 w-4 brightness-0 invert transition-opacity duration-200',
                screen === item.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-75',
              )}
              name={item.icon}
            />
            {item.label}
          </button>
        ))}
      </nav>

      <div className={styles.sidebarUser}>
        <div className={styles.userAvatar}>{initial}</div>
        <div className="min-w-0">
          <p className={styles.userName}>{technicianName}</p>
          <p className={styles.userRole}>Kỹ thuật viên</p>
        </div>
        <button aria-label="Đăng xuất" className={styles.iconButton} onClick={onLogout} type="button">
          <AssetIcon className="h-4 w-4" name="icon-logout.svg" />
        </button>
      </div>
    </aside>
  );
}
