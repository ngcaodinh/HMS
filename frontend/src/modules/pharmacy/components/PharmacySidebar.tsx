/**
 * @file PharmacySidebar.tsx
 * @description Thanh Điều Hướng Sidebar Dark Midnight đồng nhất cho Phân hệ Dược sĩ & Nhà thuốc
 * @author Senior Frontend Engineer
 */

'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { PharmacyScreen } from '../types/pharmacy.types';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

interface PharmacySidebarProps {
  /** Màn hình đang active */
  activeScreen: PharmacyScreen;
  /** Hàm callback khi người dùng chọn chuyển màn hình */
  onSelectScreen: (screen: PharmacyScreen) => void;
  /** Hàm callback mở modal đăng xuất */
  onOpenLogoutModal: () => void;
}

/**
 * Component Sidebar Phân hệ Quản lý Dược (Đồng nhất với hệ thống HMS)
 */
export const PharmacySidebar: React.FC<PharmacySidebarProps> = ({
  activeScreen,
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

  return (
    <aside className={styles.sidebar}>
      {/* Sidebar Header & Brand Logo */}
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarLogoRow}>
          <div className={styles.sidebarLogoMark}>
            <Image
              alt="HMS-VN Logo"
              className="h-full w-full object-cover"
              height={34}
              priority
              src="/hms-login-logo.png"
              width={34}
              onError={(e) => {
                // Fallback nếu chưa có file hms-login-logo.png
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0">
            <div className={styles.sidebarLogoText}>HMS-VN</div>
            <div className={styles.sidebarLogoSub}>Dược sĩ &amp; Nhà thuốc</div>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav className={styles.sidebarNav} aria-label="Quản lý Dược">
        <div className={styles.sidebarSectionLabel}>Quản lý Dược</div>

        {/* Screen 1: Cấp phát thuốc theo đơn */}
        <button
          type="button"
          className={`${styles.sidebarNavBtn} ${
            activeScreen === 'dispense' ? styles.sidebarNavBtnActive : ''
          }`}
          onClick={() => onSelectScreen('dispense')}
          aria-label="Cấp phát thuốc theo đơn"
        >
          <span
            className={`w-5 flex items-center justify-center transition-colors ${
              activeScreen === 'dispense' ? 'text-[#55d7ed]' : 'text-white/75'
            }`}
          >
            <svg className="w-[18px] h-[18px] stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <path d="M10.5 20.4l-6.9-6.9c-2.1-2.1-2.1-5.5 0-7.6l2.1-2.1c2.1-2.1 5.5-2.1 7.6 0l6.9 6.9c2.1 2.1 2.1 5.5 0 7.6l-2.1 2.1c-2.1 2.1-5.5 2.1-7.6 0z" />
              <path d="m8.5 8.5 7 7" />
            </svg>
          </span>
          <span className="flex-1 truncate">Cấp phát thuốc theo đơn</span>
        </button>

        {/* Screen 2: Quản lý kho thuốc & Lô */}
        <button
          type="button"
          className={`${styles.sidebarNavBtn} ${
            activeScreen === 'inventory' ? styles.sidebarNavBtnActive : ''
          }`}
          onClick={() => onSelectScreen('inventory')}
          aria-label="Quản lý kho thuốc & Lô"
        >
          <span
            className={`w-5 flex items-center justify-center transition-colors ${
              activeScreen === 'inventory' ? 'text-[#55d7ed]' : 'text-white/75'
            }`}
          >
            <svg className="w-[18px] h-[18px] stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </span>
          <span className="flex-1 truncate">Quản lý kho thuốc &amp; Lô</span>
        </button>

        {/* Screen 3: Nhập kho dược */}
        <button
          type="button"
          className={`${styles.sidebarNavBtn} ${
            activeScreen === 'stock-import' ? styles.sidebarNavBtnActive : ''
          }`}
          onClick={() => onSelectScreen('stock-import')}
          aria-label="Nhập kho dược"
        >
          <span
            className={`w-5 flex items-center justify-center transition-colors ${
              activeScreen === 'stock-import' ? 'text-[#55d7ed]' : 'text-white/75'
            }`}
          >
            <svg className="w-[18px] h-[18px] stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </span>
          <span className="flex-1 truncate">Nhập kho dược</span>
        </button>

        {/* Screen 4: Đơn thuốc & XML Quốc gia */}
        <button
          type="button"
          className={`${styles.sidebarNavBtn} ${
            activeScreen === 'national-xml' ? styles.sidebarNavBtnActive : ''
          }`}
          onClick={() => onSelectScreen('national-xml')}
          aria-label="Đơn thuốc & XML Quốc gia"
        >
          <span
            className={`w-5 flex items-center justify-center transition-colors ${
              activeScreen === 'national-xml' ? 'text-[#55d7ed]' : 'text-white/75'
            }`}
          >
            <svg className="w-[18px] h-[18px] stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <polyline points="16,18 22,12 16,6" />
              <polyline points="8,6 2,12 8,18" />
            </svg>
          </span>
          <span className="flex-1 truncate">Đơn thuốc &amp; XML Quốc gia</span>
        </button>

        {/* Screen 5: Báo cáo biến động kho */}
        <button
          type="button"
          className={`${styles.sidebarNavBtn} ${
            activeScreen === 'reports' ? styles.sidebarNavBtnActive : ''
          }`}
          onClick={() => onSelectScreen('reports')}
          aria-label="Báo cáo biến động kho"
        >
          <span
            className={`w-5 flex items-center justify-center transition-colors ${
              activeScreen === 'reports' ? 'text-[#55d7ed]' : 'text-white/75'
            }`}
          >
            <svg className="w-[18px] h-[18px] stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          <span className="flex-1 truncate">Báo cáo biến động kho</span>
        </button>
      </nav>

      {/* Sidebar Footer */}
      <div className={styles.sidebarFooter}>
        <div className={styles.sidebarClockRow}>
          <span className={styles.sidebarClockLabel}>Hệ thống trực</span>
          <div className={styles.sidebarClockValue}>{timeString}</div>
        </div>
        <div className={styles.sidebarUserRow}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={styles.sidebarUserAvatar}>DS</div>
            <div className={styles.sidebarUserInfo}>
              <div className={styles.sidebarUserName}>DS. Phạm Thanh Hà</div>
              <div className={styles.sidebarUserRole}>Dược sĩ lâm sàng / Kho Dược</div>
            </div>
          </div>
          <button
            type="button"
            className={styles.sidebarLogoutBtn}
            onClick={onOpenLogoutModal}
            title="Đăng xuất"
            aria-label="Đăng xuất hệ thống"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};
