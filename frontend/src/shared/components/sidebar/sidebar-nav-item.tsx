import Link from 'next/link';

import { sidebarStyles as styles } from './sidebar.styles';
import type { SidebarNavItemConfig } from './sidebar.types';

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Một mục điều hướng trong Sidebar dùng chung - tự chọn render Link (nếu có href, dùng cho route
 * thật như Giám đốc) hoặc button (nếu có onClick, dùng cho đổi màn hình nội bộ như đa số module).
 * @param props - Cấu hình mục nav: label, icon, trạng thái active, onClick/href, badge.
 * @returns Phần tử điều hướng đã áp style active/hover/focus chuẩn của hệ thống.
 */
export function SidebarNavItem({ badge, href, icon, isActive, label, onClick }: SidebarNavItemConfig) {
  const className = cn(styles.navItem, isActive && styles.navItemActive);
  const content = (
    <>
      {icon}
      <span className="truncate">{label}</span>
      {badge}
    </>
  );

  if (href) {
    return (
      <Link className={className} href={href}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className} onClick={onClick} type="button">
      {content}
    </button>
  );
}
