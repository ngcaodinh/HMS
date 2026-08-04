import { RoleIcon } from '@/shared/components/role-icon';
import { Sidebar as SharedSidebar } from '@/shared/components/sidebar/sidebar';
import { sidebarStyles } from '@/shared/components/sidebar/sidebar.styles';
import type { SidebarNavSectionConfig } from '@/shared/components/sidebar/sidebar.types';

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

/**
 * Dựng icon nav với hiệu ứng mờ/rõ theo trạng thái active - dùng chung cho cả 2 nhóm nav bên dưới.
 * @param iconName - Tên file SVG trong /public/doctor-assets.
 * @param isActive - Mục nav có đang được chọn hay không.
 * @returns Icon đã áp opacity phù hợp trạng thái.
 */
function renderNavIcon(iconName: string, isActive: boolean) {
  return (
    <AssetIcon
      className={cn(
        'h-4 w-4 brightness-0 invert transition-opacity duration-200',
        isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-75',
      )}
      name={iconName}
    />
  );
}

export function Sidebar({ onChangeScreen, onLogout, pendingCount, screen, technicianName }: SidebarProps) {
  const sections: SidebarNavSectionConfig[] = [
    {
      id: 'lab',
      label: 'Xét nghiệm',
      items: LAB_NAV_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        icon: renderNavIcon(item.icon, screen === item.id),
        isActive: screen === item.id,
        onClick: () => onChangeScreen(item.id),
        badge:
          item.id === 'queue' && pendingCount > 0 ? (
            <span className={sidebarStyles.navBadge}>{pendingCount}</span>
          ) : undefined,
      })),
    },
    {
      id: 'manage',
      label: 'Quản lý',
      items: MANAGE_NAV_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        icon: renderNavIcon(item.icon, screen === item.id),
        isActive: screen === item.id,
        onClick: () => onChangeScreen(item.id),
      })),
    },
  ];

  return (
    <SharedSidebar
      footer={
        <>
          <div className={cn(styles.userAvatar, 'transition-transform duration-200 hover:scale-105')}>
            <RoleIcon role="lab_tech" />
          </div>
          <div className="min-w-0">
            <p className={styles.userName}>{technicianName}</p>
            <p className={styles.userRole}>Kỹ thuật viên</p>
          </div>
          <button aria-label="Đăng xuất" className={styles.iconButton} onClick={onLogout} type="button">
            <AssetIcon className="h-4 w-4" name="icon-logout.svg" />
          </button>
        </>
      }
      sections={sections}
    />
  );
}
