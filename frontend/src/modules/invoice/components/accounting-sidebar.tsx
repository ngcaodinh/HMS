'use client';

import { RoleIcon } from '@/shared/components/role-icon';
import { Sidebar as SharedSidebar } from '@/shared/components/sidebar/sidebar';
import type { SidebarNavSectionConfig } from '@/shared/components/sidebar/sidebar.types';

import { AccountingScreenId } from '../types/invoice.types';

interface AccountingSidebarProps {
  activeScreen: AccountingScreenId;
  onSelectScreen: (screen: AccountingScreenId) => void;
  onLogoutClick: () => void;
}

const NAV_ITEMS: { id: AccountingScreenId; label: string; iconSvg: JSX.Element }[] = [
  {
    id: 's1',
    label: 'Tra cứu hồ sơ',
    iconSvg: (
      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    id: 's2',
    label: 'Lập hóa đơn',
    iconSvg: (
      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    id: 's3',
    label: 'Thanh toán & Bảng kê',
    iconSvg: (
      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    id: 's4',
    label: 'Quản lý tạm ứng',
    iconSvg: (
      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    id: 's5',
    label: 'Báo cáo tài chính',
    iconSvg: (
      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 00-2 2h2a2 2 0 00-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

export function AccountingSidebar({
  activeScreen,
  onSelectScreen,
  onLogoutClick,
}: AccountingSidebarProps) {
  const sections: SidebarNavSectionConfig[] = [
    {
      id: 'accounting',
      label: 'Lập hóa đơn & thanh toán',
      items: NAV_ITEMS.map((item) => {
        const isActive = activeScreen === item.id;
        return {
          id: item.id,
          label: item.label,
          icon: <div className={isActive ? 'text-[#55d7ed]' : 'text-white/65'}>{item.iconSvg}</div>,
          isActive,
          onClick: () => onSelectScreen(item.id),
        };
      }),
    },
  ];

  return (
    <SharedSidebar
      footer={
        <>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#55d7ed] to-[#96ccff] font-bold text-[#003d5c] text-sm shadow-[0_2px_6px_rgba(0,96,150,0.3)] transition-transform duration-200 hover:scale-105">
            <RoleIcon role="accountant" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-5 text-white">Peter Nguyễn</p>
            <p className="text-[11px] font-medium leading-[16.5px] text-white/50">Kế toán viên</p>
          </div>
          <button
            type="button"
            aria-label="Đăng xuất"
            onClick={onLogoutClick}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/70 transition-all duration-200 ease-out hover:bg-white/10 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55d7ed] focus-visible:ring-offset-2 focus-visible:ring-offset-[#001d32]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6.5A1.5 1.5 0 0 1 10 18.5V17M4 12h10m0 0-3-3m3 3-3 3"
              />
            </svg>
          </button>
        </>
      }
      sections={sections}
    />
  );
}
