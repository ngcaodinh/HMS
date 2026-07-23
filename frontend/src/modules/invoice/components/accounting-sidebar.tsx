'use client';

import Image from 'next/image';
import { AccountingScreenId } from '../types/invoice.types';

interface AccountingSidebarProps {
  activeScreen: AccountingScreenId;
  onSelectScreen: (screen: AccountingScreenId) => void;
  onLogoutClick: () => void;
}

export function AccountingSidebar({
  activeScreen,
  onSelectScreen,
  onLogoutClick,
}: AccountingSidebarProps) {
  const navItems: { id: AccountingScreenId; label: string; iconSvg: JSX.Element }[] = [
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

  return (
    <aside className="flex shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#001d32] text-white lg:h-screen lg:w-[260px] select-none font-sans">
      {/* Sidebar Header with Standard HMS Logo */}
      <div className="flex h-[64px] shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <div className="relative flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#006096] shadow-[0_2px_4px_rgba(0,96,150,0.3)]">
          <Image alt="HMS-VN" height={34} priority src="/hms-login-logo.png" width={34} />
        </div>
        <div>
          <p className="text-[15px] font-bold leading-[18.75px] text-white">HMS-VN</p>
          <p className="mt-0.5 whitespace-nowrap text-[10px] uppercase leading-[15px] tracking-[0.4px] text-white/55">
            BỆNH VIỆN DA LIỄU
          </p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <p className="px-3 py-1 text-[10px] font-bold uppercase leading-[15px] tracking-[1px] text-white/40">
          lập hóa đơn &amp; thanh toán
        </p>

        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectScreen(item.id)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-[12.5px] font-medium transition ${
                isActive
                  ? 'rounded-bl-lg rounded-tl-lg rounded-tr-lg border-l-4 border-[#22d3ee] bg-white/15 pl-4 font-semibold text-white shadow-sm'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className={isActive ? 'text-[#22d3ee]' : 'text-white/65'}>{item.iconSvg}</div>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer User Card */}
      <div className="mt-auto flex h-[73px] shrink-0 items-center gap-3 border-t border-white/10 px-4 bg-black/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 font-bold text-white text-sm shadow">
          CĐ
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-5 text-white">Peter Nguyễn</p>
          <p className="text-[11px] font-medium leading-[16.5px] text-white/50">Kế toán viên</p>
        </div>
        <button
          type="button"
          aria-label="Đăng xuất"
          onClick={onLogoutClick}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/70 transition hover:bg-white/10 focus:outline-none"
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
      </div>
    </aside>
  );
}
