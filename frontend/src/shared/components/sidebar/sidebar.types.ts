import type { ReactNode } from 'react';

/** Tông màu của Sidebar - 'danger' dùng riêng cho chế độ khẩn cấp (vd: tiếp nhận cấp cứu ở Lễ tân). */
export type SidebarTone = 'default' | 'danger';

/**
 * Cấu hình một mục điều hướng trong Sidebar dùng chung.
 * Hỗ trợ cả điều hướng đổi màn hình nội bộ (onClick) lẫn điều hướng route thật (href, dùng next/link).
 */
export type SidebarNavItemConfig = {
  id: string;
  label: string;
  /** Icon do module cha tự truyền vào (AssetIcon/SVG nội bộ) - Sidebar không áp đặt hệ icon riêng. */
  icon: ReactNode;
  isActive: boolean;
  /** Dùng khi mục nav đổi màn hình nội bộ (đa số module). */
  onClick?: () => void;
  /** Dùng khi mục nav là route thật (hiện chỉ Giám đốc dùng, render next/link thay vì button). */
  href?: string;
  /** Badge đã được module cha style sẵn (giữ đúng màu/ý nghĩa hiện có của từng module). */
  badge?: ReactNode;
};

/** Một nhóm mục điều hướng, có thể có tiêu đề nhóm hoặc không (sidebar không chia nhóm thì bỏ trống label). */
export type SidebarNavSectionConfig = {
  id: string;
  label?: string;
  items: SidebarNavItemConfig[];
};
