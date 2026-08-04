/**
 * @file PharmacySidebar.tsx
 * @description Thanh Điều Hướng Sidebar dùng chung (shared Sidebar) cho Phân hệ Dược sĩ & Nhà thuốc
 * @author Senior Frontend Engineer
 */

'use client';

import React, { useEffect, useState } from 'react';

import { RoleIcon } from '@/shared/components/role-icon';
import { Sidebar as SharedSidebar } from '@/shared/components/sidebar/sidebar';
import type { SidebarNavSectionConfig } from '@/shared/components/sidebar/sidebar.types';

import type { PharmacyScreen } from '../types/pharmacy.types';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

interface PharmacySidebarProps {
  /** Màn hình đang active */
  activeScreen: PharmacyScreen;
  /** Tên dược sĩ đăng nhập (tùy chọn) */
  pharmacistName?: string;
  /** Hàm callback khi người dùng chọn chuyển màn hình */
  onSelectScreen: (screen: PharmacyScreen) => void;
  /** Hàm callback mở modal đăng xuất */
  onOpenLogoutModal: () => void;
}

const NAV_ITEMS: { id: PharmacyScreen; label: string; icon: JSX.Element }[] = [
  {
    id: 'dispense',
    label: 'Cấp phát thuốc theo đơn',
    icon: (
      <svg className="h-[18px] w-[18px] stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M10.5 20.4l-6.9-6.9c-2.1-2.1-2.1-5.5 0-7.6l2.1-2.1c2.1-2.1 5.5-2.1 7.6 0l6.9 6.9c2.1 2.1 2.1 5.5 0 7.6l-2.1 2.1c-2.1 2.1-5.5 2.1-7.6 0z" />
        <path d="m8.5 8.5 7 7" />
      </svg>
    ),
  },
  {
    id: 'inventory',
    label: 'Quản lý kho thuốc & Lô',
    icon: (
      <svg className="h-[18px] w-[18px] stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" x2="12" y1="22.08" y2="12" />
      </svg>
    ),
  },
  {
    id: 'stock-import',
    label: 'Nhập kho dược',
    icon: (
      <svg className="h-[18px] w-[18px] stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="12" x2="12" y1="18" y2="12" />
        <line x1="9" x2="15" y1="15" y2="15" />
      </svg>
    ),
  },
  {
    id: 'national-xml',
    label: 'Đơn thuốc & XML Quốc gia',
    icon: (
      <svg className="h-[18px] w-[18px] stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="16,18 22,12 16,6" />
        <polyline points="8,6 2,12 8,18" />
      </svg>
    ),
  },
  {
    id: 'reports',
    label: 'Báo cáo biến động kho',
    icon: (
      <svg className="h-[18px] w-[18px] stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </svg>
    ),
  },
];

/**
 * Hiển thị thanh điều hướng Sidebar dùng chung hệ thống HMS-VN cho phân hệ Dược.
 *
 * @param activeScreen Màn hình phân hệ dược đang được chọn
 * @param pharmacistName Tên hiển thị của Dược sĩ đăng nhập
 * @param onSelectScreen Callback điều hướng màn hình
 * @param onOpenLogoutModal Callback mở hộp thoại xác nhận đăng xuất
 * @returns Component React hiển thị thanh điều hướng bên trái với đồng hồ thời gian thực
 */
export const PharmacySidebar: React.FC<PharmacySidebarProps> = ({
  activeScreen,
  pharmacistName,
  onSelectScreen,
  onOpenLogoutModal,
}) => {
  const [timeString, setTimeString] = useState<string>('07:45:32');

  // Đăng ký đồng hồ thời gian thực
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTimeString(`${h}:${m}:${s}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const sections: SidebarNavSectionConfig[] = [
    {
      id: 'pharmacy',
      label: 'Quản lý Dược',
      items: NAV_ITEMS.map((item) => {
        const isActive = activeScreen === item.id;
        return {
          id: item.id,
          label: item.label,
          icon: (
            <span
              className={`flex w-5 items-center justify-center transition-colors ${
                isActive ? 'text-[#55d7ed]' : 'text-white/75'
              }`}
            >
              {item.icon}
            </span>
          ),
          isActive,
          onClick: () => onSelectScreen(item.id),
        };
      }),
    },
  ];

  return (
    <SharedSidebar
      footer={
        <div className="flex w-full flex-col gap-2">
          <div className={styles.sidebarClockRow}>
            <span className={styles.sidebarClockLabel}>Hệ thống trực</span>
            <div className={styles.sidebarClockValue}>{timeString}</div>
          </div>
          <div className={styles.sidebarUserRow}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className={`${styles.sidebarUserAvatar} transition-transform duration-200 hover:scale-105`}>
                <RoleIcon role="pharmacist" />
              </div>
              <div className={styles.sidebarUserInfo}>
                <div className={styles.sidebarUserName}>{pharmacistName || 'DS. Phạm Thanh Hà'}</div>
                <div className={styles.sidebarUserRole}>Dược sĩ lâm sàng / Kho Dược</div>
              </div>
            </div>
            <button
              aria-label="Đăng xuất hệ thống"
              className={styles.sidebarLogoutBtn}
              onClick={onOpenLogoutModal}
              title="Đăng xuất"
              type="button"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      }
      navAriaLabel="Quản lý Dược"
      sections={sections}
    />
  );
};
