import Image from 'next/image';

import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';
import { AssetIcon, cn } from './shared';

interface SidebarProps {
  onLogout: () => void;
  pharmacistName: string;
}

/** Only "Cấp phát thuốc theo đơn" is in scope for this lane — kho/lô, nhập kho, báo cáo biến động
 * kho are separate lanes not built here, so they aren't listed as dead nav links. */
export function Sidebar({ onLogout, pharmacistName }: SidebarProps) {
  const initial = pharmacistName.trim().charAt(0).toUpperCase() || 'D';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logoWrap}>
          <Image alt="HMS-VN" className="h-full w-full object-cover" height={34} priority src="/hms-login-logo.png" width={34} />
        </div>
        <div className="min-w-0">
          <p className={styles.brandName}>HMS-VN</p>
          <p className={styles.brandSubtitle}>Quản lý Dược &amp; Nhà thuốc</p>
        </div>
      </div>

      <nav className={styles.navSection}>
        <p className={styles.navSectionLabel}>Quản lý dược</p>
        <button className={cn(styles.navItem, styles.navItemActive)} type="button">
          <AssetIcon className="h-4 w-4" name="icon-save.svg" />
          Cấp phát thuốc theo đơn
        </button>
      </nav>

      <div className={styles.sidebarUser}>
        <div className={styles.userAvatar}>{initial}</div>
        <div className="min-w-0">
          <p className={styles.userName}>{pharmacistName}</p>
          <p className={styles.userRole}>Dược sĩ</p>
        </div>
        <button aria-label="Đăng xuất" className={styles.iconButton} onClick={onLogout} type="button">
          <AssetIcon className="h-4 w-4 invert" name="icon-logout.svg" />
        </button>
      </div>
    </aside>
  );
}
