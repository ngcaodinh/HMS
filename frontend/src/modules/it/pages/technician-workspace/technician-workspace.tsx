'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { itTechnicianWorkspaceStyles as styles } from './technician-workspace.styles';

type PageKind = 'monitoring' | 'audit' | 'users' | 'rbac' | 'backup';
type Tone = 'green' | 'sky' | 'amber' | 'red' | 'slate' | 'teal';
type IconName =
  | 'activity'
  | 'alert'
  | 'bell'
  | 'check'
  | 'chevronLeft'
  | 'chevronRight'
  | 'database'
  | 'download'
  | 'eye'
  | 'fileText'
  | 'hardDrive'
  | 'key'
  | 'lock'
  | 'logOut'
  | 'plus'
  | 'refresh'
  | 'search'
  | 'server'
  | 'shield'
  | 'users'
  | 'wifi';

type NavItem = {
  key: PageKind;
  label: string;
  icon: IconName;
  badge?: string;
};

type SummaryCard = {
  label: string;
  value: string;
  helper: string;
  tone: Tone;
};

type ServiceStatus = {
  name: string;
  endpoint: string;
  metricLabel: string;
  metricValue: string;
  isOnline: boolean;
  icon: IconName;
};

type ResourceMetric = {
  label: string;
  detail: string;
  value: number;
  tone: Tone;
};

type ActivityMetric = {
  label: string;
  value: string;
  percent: number;
  tone: Tone;
};

type ErrorLog = {
  time: string;
  module: string;
  code: string;
  message: string;
  count: string;
  severity: string;
  tone: Tone;
};

type AuditLog = {
  time: string;
  account: string;
  employeeId: string;
  ip: string;
  action: string;
  description: string;
  module: string;
  tone: Tone;
};

type StaffUser = {
  id: string;
  username: string;
  name: string;
  role: string;
  phone: string;
  lastLogin: string;
  status: 'active' | 'locked' | 'current';
};

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Giám sát',
    items: [
      { key: 'monitoring', label: 'Giám sát hệ thống', icon: 'activity', badge: '2' },
      { key: 'audit', label: 'Nhật ký kiểm toán', icon: 'fileText' },
    ],
  },
  {
    label: 'Quản trị',
    items: [
      { key: 'users', label: 'Tài khoản nhân viên', icon: 'users' },
      { key: 'rbac', label: 'Phân quyền & Vai trò', icon: 'shield' },
      { key: 'backup', label: 'Sao lưu & Khôi phục', icon: 'database' },
    ],
  },
];

const pageTitles: Record<PageKind, string> = {
  audit: 'Nhật ký Kiểm toán',
  backup: 'Sao lưu & Khôi phục',
  monitoring: 'Giám sát Hệ thống',
  rbac: 'Phân quyền Hệ thống',
  users: 'Tài khoản nhân viên',
};

const summaryCards: SummaryCard[] = [
  { label: 'Dịch vụ hoạt động', value: '4 / 5', helper: '1 lỗi kết nối', tone: 'green' },
  { label: 'Yêu cầu / phút', value: '142', helper: 'Bình thường', tone: 'sky' },
  { label: 'Lỗi trong 24h', value: '7', helper: '2 lỗi nghiêm trọng', tone: 'amber' },
  { label: 'Uptime hệ thống', value: '99.7%', helper: '30 ngày qua', tone: 'green' },
];

const serviceStatuses: ServiceStatus[] = [
  {
    endpoint: 'next.js:3000',
    icon: 'server',
    isOnline: true,
    metricLabel: 'Ping',
    metricValue: '12 ms',
    name: 'Frontend',
  },
  {
    endpoint: 'express:4000',
    icon: 'server',
    isOnline: true,
    metricLabel: 'Ping',
    metricValue: '8 ms',
    name: 'Backend API',
  },
  {
    endpoint: 'mysql:3306',
    icon: 'database',
    isOnline: true,
    metricLabel: 'Ping',
    metricValue: '4 ms',
    name: 'Database',
  },
  {
    endpoint: 'ws:4001',
    icon: 'wifi',
    isOnline: true,
    metricLabel: 'Ping',
    metricValue: '6 ms',
    name: 'Socket.io',
  },
  {
    endpoint: 'webhook:8080',
    icon: 'alert',
    isOnline: false,
    metricLabel: 'Timeout',
    metricValue: '5000ms',
    name: 'Momo Sandbox',
  },
];

const resourceMetrics: ResourceMetric[] = [
  { label: 'CPU', detail: '8 cores - 2.4 GHz', value: 70, tone: 'sky' },
  { label: 'RAM', detail: '8.6 GB / 16 GB', value: 54, tone: 'green' },
  { label: 'DISK', detail: '400 GB / 500 GB', value: 80, tone: 'amber' },
];

const activityMetrics: ActivityMetric[] = [
  { label: 'Yêu cầu Auth', value: '3,421', percent: 86, tone: 'sky' },
  { label: 'Yêu cầu Lab', value: '1,892', percent: 58, tone: 'teal' },
  { label: 'Yêu cầu Pharmacy', value: '987', percent: 36, tone: 'slate' },
  { label: 'Yêu cầu Billing', value: '624', percent: 24, tone: 'amber' },
  { label: 'Tổng lỗi phát sinh', value: '7', percent: 18, tone: 'red' },
];

const errorLogs: ErrorLog[] = [
  {
    code: 'CONN_TIMEOUT',
    count: 'x12',
    message: 'Webhook MoMo Sandbox không phản hồi sau 5000ms',
    module: 'Billing',
    severity: 'Nghiêm trọng',
    time: '2026-07-18 07:42:11',
    tone: 'red',
  },
  {
    code: 'JWT_EXPIRED',
    count: 'x3',
    message: 'Token hết hạn không được làm mới đúng quy trình (3 tài khoản)',
    module: 'Auth',
    severity: 'Cảnh báo',
    time: '2026-07-18 06:15:03',
    tone: 'amber',
  },
  {
    code: 'BACKUP_SUCCESS',
    count: 'x1',
    message: 'Sao lưu tự động hoàn thành - hms_backup_20260718_030000.sql',
    module: 'Backup',
    severity: 'Thông tin',
    time: '2026-07-18 03:30:00',
    tone: 'green',
  },
];

const auditLogs: AuditLog[] = [
  {
    account: 'khoa.tran',
    action: 'LOGIN_SUCCESS',
    description: 'Đăng nhập thành công từ Chrome/Windows',
    employeeId: 'NV-0041',
    ip: '192.168.1.42',
    module: 'Auth',
    time: '2026-07-18 08:02:11.344',
    tone: 'green',
  },
  {
    account: 'pharmacy.lead',
    action: 'OVERRIDE_ALLERGY',
    description: 'Ghi đè cảnh báo dị ứng Penicillin cho BN mã ***1847 - lý do cấp cứu',
    employeeId: 'NV-0015',
    ip: '192.168.1.50',
    module: 'Pharmacy',
    time: '2026-07-18 07:55:03.112',
    tone: 'amber',
  },
  {
    account: 'huong.le',
    action: 'BYPASS_EMERGENCY',
    description: 'Kích hoạt bypass cấp cứu - truy cập hồ sơ BN mã ***2031',
    employeeId: 'NV-0027',
    ip: '192.168.1.58',
    module: 'Emergency',
    time: '2026-07-18 07:48:22.904',
    tone: 'red',
  },
  {
    account: 'dung.pham',
    action: 'SIGN_PRESCRIPTION',
    description: 'Xác nhận đơn thuốc mã RX-20260718-0041 - 3 hoạt chất',
    employeeId: 'NV-0035',
    ip: '192.168.1.77',
    module: 'Doctor',
    time: '2026-07-18 07:31:44.001',
    tone: 'sky',
  },
  {
    account: 'ket.toan01',
    action: 'PAY_INVOICE',
    description: 'Thanh toán hóa đơn INV-20260718-0012 - 450.000 VND - BHYT 80%',
    employeeId: 'NV-0019',
    ip: '192.168.1.91',
    module: 'Billing',
    time: '2026-07-18 06:58:09.778',
    tone: 'teal',
  },
  {
    account: 'system',
    action: 'BACKUP_AUTO',
    description: 'Sao lưu tự động hoàn thành - 1.24 GB',
    employeeId: 'AUTO',
    ip: '127.0.0.1',
    module: 'Admin',
    time: '2026-07-18 03:30:00.001',
    tone: 'slate',
  },
];

const permissionColumns = [
  'Tiếp đón BN',
  'Khám & Y lệnh',
  'Kê đơn điện tử',
  'Tải KQ xét nghiệm',
  'Lập hóa đơn',
  'Đóng hồ sơ BA',
  'Xem log kiểm toán',
  'Cấu hình hệ thống',
];

const permissionRows = [
  { role: 'Quản trị viên', tone: 'red', values: [true, true, true, true, true, true, true, true] },
  { role: 'Giám đốc', tone: 'amber', values: [true, false, false, false, true, true, true, false] },
  { role: 'Bác sĩ', tone: 'sky', values: [false, true, true, false, false, true, false, false] },
  { role: 'Điều dưỡng', tone: 'teal', values: [false, true, false, true, false, false, false, false] },
  { role: 'Dược sĩ', tone: 'amber', values: [false, false, true, false, false, false, false, false] },
  { role: 'KTV Xét nghiệm', tone: 'slate', values: [false, false, false, true, false, false, false, false] },
  { role: 'Lễ tân', tone: 'slate', values: [true, false, false, false, true, false, false, false] },
  { role: 'Kế toán', tone: 'slate', values: [false, false, false, false, true, false, false, false] },
  { role: 'Kỹ thuật IT', tone: 'sky', values: [false, false, false, false, false, false, true, true] },
] satisfies Array<{ role: string; tone: Tone; values: boolean[] }>;

const userStats: SummaryCard[] = [
  { label: 'Tổng tài khoản', value: '48', helper: 'Tổng số', tone: 'sky' },
  { label: 'Đang hoạt động', value: '45', helper: 'Hoạt động', tone: 'green' },
  { label: 'Bị khóa', value: '3', helper: 'Hạn chế', tone: 'red' },
  { label: 'Đăng nhập hôm nay', value: '31', helper: 'Hôm nay', tone: 'teal' },
];

const staffUsers: StaffUser[] = [
  {
    id: 'NV-0041',
    lastLogin: '18/07/2026 07:30',
    name: 'Trần Minh Khoa',
    phone: '0912 345 678',
    role: 'Bác sĩ',
    status: 'active',
    username: 'khoa.tran',
  },
  {
    id: 'NV-0027',
    lastLogin: '18/07/2026 06:55',
    name: 'Lê Thị Thu Hương',
    phone: '0987 654 321',
    role: 'Điều dưỡng',
    status: 'active',
    username: 'huong.le',
  },
  {
    id: 'NV-0035',
    lastLogin: '17/07/2026 20:11',
    name: 'Phạm Văn Dũng',
    phone: '0903 111 222',
    role: 'Dược sĩ',
    status: 'active',
    username: 'dung.pham',
  },
  {
    id: 'NV-0012',
    lastLogin: '10/06/2026 14:22',
    name: 'Ngô Thị Bảo Châu',
    phone: '0967 888 999',
    role: 'Kế toán',
    status: 'locked',
    username: 'chau.ngo',
  },
  {
    id: 'NV-0003',
    lastLogin: '18/07/2026 08:00',
    name: 'Nguyễn Đức Hùng',
    phone: '0978 000 001',
    role: 'KTV IT',
    status: 'current',
    username: 'hung.nguyen',
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getToneClasses(tone: Tone) {
  return {
    amber: {
      bar: 'bg-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
    },
    green: {
      bar: 'bg-green-800',
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
    },
    red: {
      bar: 'bg-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
    },
    sky: {
      bar: 'bg-sky-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-sky-700',
    },
    slate: {
      bar: 'bg-slate-500',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      text: 'text-slate-600',
    },
    teal: {
      bar: 'bg-teal-500',
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-700',
    },
  }[tone];
}

function getToneHex(tone: Tone) {
  return {
    amber: '#b45309',
    green: '#166534',
    red: '#b91c1c',
    sky: '#0369a1',
    slate: '#64748b',
    teal: '#14b8a6',
  }[tone];
}

function Icon({ className, name }: { className?: string; name: IconName }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      {name === 'activity' && <path d="M4 13h4l2-6 4 10 2-4h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />}
      {name === 'alert' && <path d="M12 4 3 20h18L12 4Zm0 5v5m0 3h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />}
      {name === 'bell' && <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />}
      {name === 'check' && <path d="m5 12.5 4 4L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />}
      {name === 'chevronLeft' && <path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />}
      {name === 'chevronRight' && <path d="m9 18 6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />}
      {name === 'database' && <path d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />}
      {name === 'download' && <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 20h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />}
      {name === 'eye' && <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />}
      {name === 'fileText' && <path d="M7 3h7l4 4v14H7V3Zm7 0v5h5M9 13h6M9 17h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />}
      {name === 'hardDrive' && <path d="M5 5h14l2 9v5H3v-5l2-9Zm-2 9h18M7 17h.01M11 17h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />}
      {name === 'key' && <path d="M14 7a5 5 0 1 0 1.2 5.2L21 6.4V4h-2.4l-1.4 1.4H15.2L14 7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />}
      {name === 'lock' && <path d="M7 10V8a5 5 0 0 1 10 0v2m-11 0h12v10H6V10Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />}
      {name === 'logOut' && <path d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6.5A1.5 1.5 0 0 1 10 18.5V17M4 12h10m0 0-3-3m3 3-3 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />}
      {name === 'plus' && <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />}
      {name === 'refresh' && <path d="M20 12a8 8 0 0 1-13.7 5.7L4 15m0 0v5h5M4 12A8 8 0 0 1 17.7 6.3L20 9m0 0V4h-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />}
      {name === 'search' && <path d="m20 20-4.2-4.2M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />}
      {name === 'server' && <path d="M5 3h14v7H5V3Zm0 11h14v7H5v-7Zm3-7h.01M8 18h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />}
      {name === 'shield' && <path d="M12 3 5 6v5c0 4.2 2.7 7.6 7 10 4.3-2.4 7-5.8 7-10V6l-7-3Zm-3 9 2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />}
      {name === 'users' && <path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 7c0-1.7-1-3.2-2.5-3.8M17 5.1a3 3 0 0 1 0 5.8M5 19c0-1.7 1-3.2 2.5-3.8M7 5.1a3 3 0 0 0 0 5.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />}
      {name === 'wifi' && <path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01M2 9a14.5 14.5 0 0 1 20 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />}
    </svg>
  );
}

function SearchBox({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="relative block w-full">
      <span className="sr-only">{label}</span>
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" name="search" />
      <input className={styles.searchInput} placeholder={placeholder} type="search" />
    </label>
  );
}

function ToneBadge({ children, tone }: { children: ReactNode; tone: Tone }) {
  const toneClass = getToneClasses(tone);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold',
        toneClass.bg,
        toneClass.border,
        toneClass.text,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', toneClass.bar)} />
      {children}
    </span>
  );
}

function ItSidebar({
  activePage,
  onChangePage,
}: {
  activePage: PageKind;
  onChangePage: (page: PageKind) => void;
}) {
  return (
    <aside className={styles.sidebar} aria-label="Thanh điều hướng quản trị hệ thống">
      <div className={styles.sidebarHeader}>
        <div className="flex items-center gap-3">
          <div className={styles.logoMark}>
            <Image alt="HMS-VN" height={40} priority src="/hms-login-logo.png" width={40} />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold leading-6">HMS-VN</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.6px] text-white/50">
              Quản trị hệ thống
            </p>
          </div>
        </div>
      </div>

      <nav className={styles.nav}>
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className={styles.navSection}>{group.label}</p>
            {group.items.map((item) => (
              <button
                aria-current={activePage === item.key ? 'page' : undefined}
                className={cn(styles.navItem, activePage === item.key && styles.navItemActive)}
                key={item.key}
                onClick={() => onChangePage(item.key)}
                type="button"
              >
                <Icon className={styles.navIcon} name={item.icon} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className="flex items-center justify-between text-[10px] text-white/45">
          <span>Hệ thống trực</span>
          <span className="font-mono text-xs font-semibold text-white/90">09:51:54</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-white">
            NH
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white/90">Nguyễn Đức Hùng</p>
            <p className="mt-0.5 text-[10px] text-white/50">Kỹ thuật viên IT</p>
          </div>
          <button aria-label="Đăng xuất" className="rounded-md border border-white/10 p-2 text-white/90" type="button">
            <Icon className="h-4 w-4" name="logOut" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function ItTopbar({ activePage }: { activePage: PageKind }) {
  return (
    <header className={styles.topbar}>
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-sm font-semibold text-sky-700">HMS-VN</span>
        <span className="text-sm font-light text-slate-300">/</span>
        <h1 className="truncate text-sm font-semibold text-slate-700">{pageTitles[activePage]}</h1>
        {activePage === 'monitoring' ? (
          <ToneBadge tone="green">LIVE</ToneBadge>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button aria-label="Thông báo hệ thống" className={styles.iconButton} type="button">
          <Icon className="h-5 w-5" name="bell" />
        </button>
        <button className={styles.secondaryButton} type="button">
          <Icon className="h-4 w-4" name="refresh" />
          Làm mới dữ liệu
        </button>
      </div>
    </header>
  );
}

function ItShell({
  activePage,
  children,
  onChangePage,
}: {
  activePage: PageKind;
  children: ReactNode;
  onChangePage: (page: PageKind) => void;
}) {
  return (
    <main className={styles.shell}>
      <ItSidebar activePage={activePage} onChangePage={onChangePage} />
      <section className={styles.workspace}>
        <ItTopbar activePage={activePage} />
        <div className={styles.content}>{children}</div>
        <footer className={styles.footer}>© 2026 HMS-VN Solution. All rights reserved.</footer>
      </section>
    </main>
  );
}

function PageHeader({
  actions,
  eyebrow,
  subtitle,
  title,
}: {
  actions?: ReactNode;
  eyebrow?: string;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div>
        {eyebrow ? <p className="text-[11px] font-bold uppercase tracking-[0.8px] text-sky-700">{eyebrow}</p> : null}
        <h2 className="text-xl font-bold leading-7 text-slate-950 md:text-2xl">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-500">{subtitle}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}

function SummaryCardView({ card }: { card: SummaryCard }) {
  const tone = getToneClasses(card.tone);

  return (
    <article className={cn(styles.card, 'relative overflow-hidden p-5')}>
      <div className={cn('absolute inset-x-0 top-0 h-1', tone.bar)} />
      <p className="text-[10px] font-bold uppercase tracking-[0.8px] text-slate-500">{card.label}</p>
      <p className={cn('mt-3 text-3xl font-bold leading-9', tone.text)}>{card.value}</p>
      <p className={cn('mt-1 flex items-center gap-1 text-[10px] font-semibold', tone.text)}>
        <span className={cn('h-1.5 w-1.5 rounded-full', tone.bar)} />
        {card.helper}
      </p>
    </article>
  );
}

function ServiceTile({ service }: { service: ServiceStatus }) {
  const tone = service.isOnline ? getToneClasses('green') : getToneClasses('red');

  return (
    <article className={cn('rounded-lg border-2 bg-white p-4', service.isOnline ? 'border-green-100' : 'border-red-200')}>
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-bold text-slate-950">{service.name}</h4>
        <Icon className="h-5 w-5 text-slate-400" name={service.icon} />
      </div>
      <p className="mt-3 rounded bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-600">
        {service.endpoint}
      </p>
      <p className={cn('mt-2 text-[10px]', tone.text)}>
        {service.metricLabel}: <strong>{service.metricValue}</strong>
      </p>
      <div className="mt-3">
        <ToneBadge tone={service.isOnline ? 'green' : 'red'}>
          {service.isOnline ? 'ĐANG HOẠT ĐỘNG' : 'MẤT KẾT NỐI'}
        </ToneBadge>
      </div>
    </article>
  );
}

function ResourceRing({ metric }: { metric: ResourceMetric }) {
  const tone = getToneClasses(metric.tone);
  const ringColor = getToneHex(metric.tone);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="grid h-28 w-28 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${ringColor} ${metric.value * 3.6}deg, #e5e7eb 0deg)`,
        } as React.CSSProperties}
      >
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center">
          <div>
            <p className={cn('text-xl font-bold', tone.text)}>{metric.value}%</p>
            <p className="text-[9px] font-bold uppercase text-slate-500">{metric.label}</p>
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-slate-950">{metric.label} Usage</p>
        <p className="text-[10px] text-slate-500">{metric.detail}</p>
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityMetric }) {
  const tone = getToneClasses(item.tone);

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-700">{item.label}</span>
        <span className={cn('font-bold', tone.text)}>{item.value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full', tone.bar)} style={{ width: `${item.percent}%` }} />
      </div>
    </div>
  );
}

function MonitoringContent() {
  return (
    <div className="min-w-[1080px] space-y-6 p-7">
      <PageHeader
        actions={(
          <>
            <button className={styles.secondaryButton} type="button">
              <Icon className="h-4 w-4" name="refresh" />
              Kiểm tra lại
            </button>
            <button className={styles.primaryButton} type="button">
              <Icon className="h-4 w-4" name="download" />
              Xuất log lỗi
            </button>
          </>
        )}
        subtitle="Kiểm tra kết nối thời gian thực - Cập nhật tự động mỗi 30 giây"
        title="Giám sát Hạ tầng & Dịch vụ Hệ thống"
      />

      <section className="grid grid-cols-4 gap-5">
        {summaryCards.map((card) => (
          <SummaryCardView card={card} key={card.label} />
        ))}
      </section>

      <section className={cn(styles.card, 'p-6')}>
        <div className="mb-5 flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-sky-700" />
          <h3 className={styles.sectionTitle}>Trạng thái các dịch vụ cốt lõi</h3>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {serviceStatuses.map((service) => (
            <ServiceTile key={service.name} service={service} />
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <button className={styles.secondaryButton} type="button">Restart DB Pool</button>
          <button className={styles.secondaryButton} type="button">Restart Socket.io</button>
        </div>
      </section>

      <section className="grid grid-cols-[1.1fr_0.9fr] gap-6">
        <div className={cn(styles.card, 'p-6')}>
          <div className="mb-8 flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-sky-700" />
            <h3 className={styles.sectionTitle}>Tài nguyên máy chủ</h3>
          </div>
          <div className="flex justify-center gap-10">
            {resourceMetrics.map((metric) => (
              <ResourceRing key={metric.label} metric={metric} />
            ))}
          </div>
        </div>
        <div className={cn(styles.card, 'p-6')}>
          <div className="mb-8 flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-sky-700" />
            <h3 className={styles.sectionTitle}>Hoạt động tổng hợp 24h</h3>
          </div>
          <div className="space-y-5">
            {activityMetrics.map((item) => (
              <ActivityRow item={item} key={item.label} />
            ))}
          </div>
        </div>
      </section>

      <section className={cn(styles.card, 'overflow-hidden')}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-sky-700" />
            <h3 className={styles.sectionTitle}>Nhật ký lỗi hệ thống gần nhất</h3>
          </div>
          <button className="text-[10px] font-bold text-sky-700" type="button">Xem tất cả nhật ký</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[0.5px] text-slate-500">
            <tr>
              {['Thời điểm', 'Phân hệ', 'Mã lỗi', 'Thông điệp lỗi', 'Lặp lại', 'Mức độ'].map((head) => (
                <th className="px-6 py-4" key={head}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {errorLogs.map((log) => (
              <tr key={`${log.time}-${log.code}`}>
                <td className="px-6 py-5 font-mono text-xs">{log.time}</td>
                <td className="px-6 py-5"><ToneBadge tone="sky">{log.module}</ToneBadge></td>
                <td className="px-6 py-5 font-mono text-xs font-bold">{log.code}</td>
                <td className="px-6 py-5 text-xs leading-5">{log.message}</td>
                <td className="px-6 py-5"><ToneBadge tone={log.tone}>{log.count}</ToneBadge></td>
                <td className="px-6 py-5"><ToneBadge tone={log.tone}>{log.severity}</ToneBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between bg-slate-50 px-6 py-4">
          <p className="text-[10px] text-slate-500">
            Dữ liệu log được trích xuất trực tiếp từ hệ thống theo dõi phân tán.
          </p>
          <button className={styles.primaryButton} type="button">
            <Icon className="h-4 w-4" name="download" />
            Xuất báo cáo PDF
          </button>
        </div>
      </section>
    </div>
  );
}

function AuditContent() {
  return (
    <div className="min-w-[1080px] space-y-6 p-8">
      <PageHeader
        actions={(
          <button className={styles.secondaryButton} type="button">
            <Icon className="h-4 w-4" name="download" />
            Xuất báo cáo bảo mật
          </button>
        )}
        subtitle="Chế độ chỉ đọc - Dữ liệu log không thể sửa hoặc xóa - Theo Nghị định 13/2023/NĐ-CP"
        title="Nhật ký Kiểm toán Hệ thống - Audit Logs"
      />

      <section className={cn(styles.card, 'grid grid-cols-[minmax(0,1fr)_190px_170px] gap-4 p-4')}>
        <SearchBox label="Tìm nhật ký kiểm toán" placeholder="Tìm tài khoản, IP, mã lỗi..." />
        <button className={styles.secondaryButton} type="button">Tất cả hành động</button>
        <button className={styles.secondaryButton} type="button">Tất cả phân hệ</button>
        <div className="col-span-3 flex items-center gap-3">
          <input aria-label="Từ ngày" className={styles.searchInput} defaultValue="07/18/2026" />
          <span className="text-slate-400">-</span>
          <input aria-label="Đến ngày" className={styles.searchInput} defaultValue="07/18/2026" />
        </div>
      </section>

      <section className={cn(styles.card, 'overflow-hidden')}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <ToneBadge tone="amber">3 hành động đặc biệt hôm nay</ToneBadge>
          <ToneBadge tone="slate">Tổng: 1.842 bản ghi</ToneBadge>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-[0.5px] text-slate-600">
            <tr>
              {['Thời gian', 'Tài khoản', 'Địa chỉ IP', 'Hành động', 'Mô tả thay đổi', 'Chi tiết'].map((head) => (
                <th className="px-6 py-4" key={head}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <tr key={`${log.time}-${log.action}`}>
                <td className="px-6 py-4 font-mono text-xs leading-5">{log.time}</td>
                <td className="px-6 py-4">
                  <p className="font-bold">{log.account}</p>
                  <p className="font-mono text-[11px] text-slate-500">{log.employeeId}</p>
                </td>
                <td className="px-6 py-4 font-mono text-xs">{log.ip}</td>
                <td className="px-6 py-4">
                  <p className="font-mono text-xs font-bold">{log.action}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{log.module}</p>
                </td>
                <td className="max-w-[360px] px-6 py-4 text-xs leading-5">{log.description}</td>
                <td className="px-6 py-4">
                  <button aria-label={`Xem chi tiết ${log.action}`} className={styles.iconButton} type="button">
                    <Icon className="h-4 w-4" name="eye" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <p className="text-xs font-bold text-slate-600">Dữ liệu log được bảo vệ ở cấp Database - không thể UPDATE hoặc DELETE</p>
          <div className="flex items-center gap-2">
            <button className={styles.secondaryButton} type="button">
              <Icon className="h-4 w-4" name="chevronLeft" />
              Trước
            </button>
            <button className={styles.primaryButton} type="button">1</button>
            <button className={styles.secondaryButton} type="button">
              Sau
              <Icon className="h-4 w-4" name="chevronRight" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function RbacContent() {
  return (
    <div className="min-w-[1080px] space-y-6 p-8">
      <PageHeader
        actions={(
          <>
            <button className={styles.secondaryButton} type="button">
              <Icon className="h-4 w-4" name="refresh" />
              Khôi phục mặc định
            </button>
            <button className={styles.primaryButton} type="button">
              <Icon className="h-4 w-4" name="lock" />
              Lưu cấu hình phân quyền
            </button>
          </>
        )}
        eyebrow="Phân quyền hệ thống"
        subtitle="Cấu hình chi tiết quyền thao tác theo vai trò nhân viên - Mọi thay đổi đều được ghi nhật ký kiểm toán"
        title="Ma trận phân quyền vai trò (RBAC)"
      />

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
        Quyền của vai trò admin và director đối với một số danh mục kiểm toán nhạy cảm đang được khóa chỉnh sửa để bảo vệ tính toàn vẹn hệ thống.
      </div>

      <section className={cn(styles.card, 'overflow-hidden')}>
        <table className="w-full table-fixed text-left">
          <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-[0.4px] text-slate-600">
            <tr>
              <th className="w-40 px-4 py-5">Vai trò \ Quyền</th>
              {permissionColumns.map((column) => (
                <th className="px-3 py-5 text-center" key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {permissionRows.map((row) => (
              <tr key={row.role}>
                <td className="px-4 py-4">
                  <ToneBadge tone={row.tone}>{row.role}</ToneBadge>
                </td>
                {row.values.map((isAllowed, index) => (
                  <td className="px-3 py-4 text-center" key={`${row.role}-${permissionColumns[index]}`}>
                    <span
                      aria-label={isAllowed ? 'Được cấp quyền' : 'Chưa cấp quyền'}
                      className={cn(
                        'inline-grid h-5 w-5 place-items-center border',
                        isAllowed ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-400 bg-white',
                        index > 5 && row.role !== 'Kỹ thuật IT' && 'opacity-50',
                      )}
                      role="img"
                    >
                      {isAllowed ? <Icon className="h-3.5 w-3.5" name="check" /> : null}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

interface StaffUserItem {
  id: string;
  username: string;
  name: string;
  role: string;
  phone: string;
  cccd?: string;
  dept?: string;
  lastLogin: string;
  status: 'active' | 'locked' | 'current';
  chipClass: string;
}

const initialStaffUsers: StaffUserItem[] = [
  {
    id: 'NV-0041',
    lastLogin: '18/07/2026 07:30',
    name: 'Trần Minh Khoa',
    phone: '0912 345 678',
    role: 'Bác sĩ',
    status: 'active',
    username: 'khoa.tran',
    chipClass: 'ktv-chip-blue',
  },
  {
    id: 'NV-0027',
    lastLogin: '18/07/2026 06:55',
    name: 'Lê Thị Thu Hương',
    phone: '0987 654 321',
    role: 'Điều dưỡng',
    status: 'active',
    username: 'huong.le',
    chipClass: 'ktv-chip-teal',
  },
  {
    id: 'NV-0035',
    lastLogin: '17/07/2026 20:11',
    name: 'Phạm Văn Dũng',
    phone: '0903 111 222',
    role: 'Dược sĩ',
    status: 'active',
    username: 'dung.pham',
    chipClass: 'ktv-chip-amber',
  },
  {
    id: 'NV-0012',
    lastLogin: '10/06/2026 14:22',
    name: 'Ngô Thị Bảo Châu',
    phone: '0967 888 999',
    role: 'Kế toán',
    status: 'locked',
    username: 'chau.ngo',
    chipClass: 'ktv-chip-purple',
  },
  {
    id: 'NV-0003',
    lastLogin: '18/07/2026 08:00',
    name: 'Nguyễn Đức Hùng',
    phone: '0978 000 001',
    role: 'KTV IT',
    status: 'current',
    username: 'hung.nguyen',
    chipClass: 'ktv-chip-indigo',
  },
];

function UsersContent() {
  const [users, setUsers] = useState<StaffUserItem[]>(initialStaffUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [passResetTarget, setPassResetTarget] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<StaffUserItem | null>(null);

  // Form states for Add User
  const [addForm, setAddForm] = useState({
    fullname: '',
    username: '',
    phone: '',
    cccd: '',
    role: '',
    dept: '',
    password: 'Temp@2026!',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const activeCount = users.filter((u) => u.status === 'active' || u.status === 'current').length;
  const lockedCount = users.filter((u) => u.status === 'locked').length;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  const handleToggleLock = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId && u.status !== 'current') {
          const newStatus = u.status === 'locked' ? 'active' : 'locked';
          return { ...u, status: newStatus };
        }
        return u;
      }),
    );
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.fullname || !addForm.username || !addForm.phone || !addForm.role) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    const nextIdNumber = users.length + 10;
    const newId = `NV-00${nextIdNumber}`;

    let chipClass = 'ktv-chip-blue';
    if (addForm.role.includes('Điều dưỡng')) chipClass = 'ktv-chip-teal';
    else if (addForm.role.includes('Dược sĩ')) chipClass = 'ktv-chip-amber';
    else if (addForm.role.includes('Kế toán')) chipClass = 'ktv-chip-purple';
    else if (addForm.role.includes('KTV IT')) chipClass = 'ktv-chip-indigo';

    const newUser: StaffUserItem = {
      chipClass,
      id: newId,
      lastLogin: 'Vừa khởi tạo',
      name: addForm.fullname,
      phone: addForm.phone,
      role: addForm.role.split(' ')[0],
      status: 'active',
      username: addForm.username,
    };

    setUsers((prev) => [newUser, ...prev]);
    setIsAddModalOpen(false);
    setAddForm({
      cccd: '',
      dept: '',
      fullname: '',
      password: 'Temp@2026!',
      phone: '',
      role: '',
      username: '',
    });
    alert(`Đã tạo thành công tài khoản cho ${newUser.name} (${newUser.username})`);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setUsers((prev) => prev.map((u) => (u.id === editUser.id ? editUser : u)));
    setEditUser(null);
    alert(`Đã cập nhật thông tin tài khoản ${editUser.username}`);
  };

  return (
    <div className="min-w-[1080px] space-y-5 p-6 font-sans text-slate-800">
      <style>{`
        .ktv-stat-mini {
          background: #ffffff;
          border-radius: 10px;
          padding: 14px 16px;
          border: 1px solid #dfe3e7;
          box-shadow: 0 2px 12px rgba(0,96,150,0.09), 0 1px 3px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ktv-stat-mini-label {
          font-size: 11px;
          font-weight: 600;
          color: #707882;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ktv-stat-mini-value {
          font-size: 22px;
          font-weight: 700;
          color: #171c1f;
        }
        .ktv-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.2px;
          white-space: nowrap;
        }
        .ktv-chip-blue { background: #dbeafe; color: #1e40af; }
        .ktv-chip-teal { background: #ccfbf1; color: #0f766e; }
        .ktv-chip-amber { background: #fef3c7; color: #b45309; }
        .ktv-chip-purple { background: #f3e8ff; color: #6b21a8; }
        .ktv-chip-indigo { background: #e0e7ff; color: #3730a3; }
        .ktv-chip-green { background: #dcfce7; color: #166534; }
        .ktv-chip-red { background: #fee2e2; color: #ba1a1a; }
        .ktv-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; display: inline-block; }

        .ktv-btn-action {
          width: 32px;
          height: 32px;
          padding: 0;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #dfe3e7;
          background: #ffffff;
          transition: all 180ms ease;
          cursor: pointer;
        }
        .ktv-btn-action-edit { color: #006096; }
        .ktv-btn-action-edit:hover:not(:disabled) { background: #dbeafe; border-color: #93c5fd; color: #1e40af; }
        .ktv-btn-action-key { color: #7a4f00; }
        .ktv-btn-action-key:hover:not(:disabled) { background: #fef3c7; border-color: #fde047; color: #b45309; }
        .ktv-btn-action-lock { color: #ba1a1a; }
        .ktv-btn-action-lock:hover:not(:disabled) { background: #fee2e2; border-color: #fca5a5; color: #ba1a1a; }
        .ktv-btn-action-unlock { color: #1b6e3c; }
        .ktv-btn-action-unlock:hover:not(:disabled) { background: #dcfce7; border-color: #86efac; color: #166534; }

        .ktv-pass-reveal-box {
          background: linear-gradient(135deg, #fff3e0, #ffe0b2);
          border: 2px solid #ff8f00;
          border-radius: 10px;
          padding: 16px 20px;
          text-align: center;
        }
        .ktv-pass-reveal-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #c55a00;
          margin-bottom: 6px;
        }
        .ktv-pass-reveal-value {
          font-size: 22px;
          font-weight: 700;
          font-family: monospace;
          color: #3e2c00;
          letter-spacing: 3px;
        }
        .ktv-pass-reveal-note {
          font-size: 10.5px;
          color: #7a4f00;
          margin-top: 6px;
        }

        .ktv-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(3px);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .ktv-modal {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,96,150,0.13), 0 1px 4px rgba(0,0,0,0.06);
          padding: 24px;
          width: 100%;
          position: relative;
          animation: ktv-modal-in 0.2s ease;
        }
        @keyframes ktv-modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>

      {/* Screen Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="text-[11px] font-semibold tracking-[1.4px] text-[#006096] uppercase mb-1">
            QUẢN TRỊ NGƯỜI DÙNG
          </div>
          <div className="text-[22px] font-semibold text-[#171c1f] leading-snug">
            Quản lý tài khoản nhân viên
          </div>
          <div className="text-xs text-[#707882] mt-0.5">
            Quản lý cấp phát tài khoản, cấp lại mật khẩu và kiểm soát trạng thái hoạt động của cán bộ y tế trong hệ thống
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-72">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707882]"
              fill="none"
              height="15"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="15"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" x2="16.65" y1="21" y2="16.65" />
            </svg>
            <input
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#bfc7d2] rounded-lg outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15 bg-white text-[#171c1f]"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, username, SĐT..."
              type="text"
              value={searchQuery}
            />
          </div>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006096] hover:bg-[#004f7e] text-white text-xs font-semibold rounded-lg shadow-sm transition whitespace-nowrap"
            onClick={() => setIsAddModalOpen(true)}
            type="button"
          >
            <svg
              fill="none"
              height="14"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              width="14"
            >
              <line x1="12" x2="12" y1="5" y2="19" />
              <line x1="5" x2="19" y1="12" y2="12" />
            </svg>
            Thêm tài khoản mới
          </button>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="ktv-stat-mini">
          <div className="ktv-stat-mini-label">Tổng tài khoản</div>
          <div className="ktv-stat-mini-value">48</div>
        </div>
        <div className="ktv-stat-mini">
          <div className="ktv-stat-mini-label">Đang hoạt động</div>
          <div className="ktv-stat-mini-value" style={{ color: '#1b6e3c' }}>
            {activeCount + 40}
          </div>
        </div>
        <div className="ktv-stat-mini">
          <div className="ktv-stat-mini-label">Bị khóa</div>
          <div className="ktv-stat-mini-value" style={{ color: '#ba1a1a' }}>
            {lockedCount + 2}
          </div>
        </div>
        <div className="ktv-stat-mini">
          <div className="ktv-stat-mini-label">Đăng nhập hôm nay</div>
          <div className="ktv-stat-mini-value" style={{ color: '#006096' }}>
            31
          </div>
        </div>
      </div>

      {/* Table Card Container */}
      <div className="bg-white rounded-2xl border border-[#dfe3e7] shadow-[0_2px_12px_rgba(0,96,150,0.09)] p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="user-table">
            <thead>
              <tr className="bg-[#f0f4f8] text-[11px] font-semibold text-[#707882] uppercase tracking-[0.5px] border-b border-[#dfe3e7]">
                <th className="px-3.5 py-2.5">Mã NV</th>
                <th className="px-3.5 py-2.5">Username</th>
                <th className="px-3.5 py-2.5">Họ và tên</th>
                <th className="px-3.5 py-2.5">Vai trò</th>
                <th className="px-3.5 py-2.5">Số điện thoại</th>
                <th className="px-3.5 py-2.5">Đăng nhập cuối</th>
                <th className="px-3.5 py-2.5">Trạng thái</th>
                <th className="px-3.5 py-2.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isLocked = user.status === 'locked';
                const isCurrent = user.status === 'current';

                return (
                  <tr
                    className={`border-b border-[#dfe3e7] hover:bg-[#e8f4ff] transition ${
                      isLocked ? 'opacity-60 bg-slate-50/50' : ''
                    }`}
                    key={user.id}
                  >
                    <td className="px-3.5 py-3 font-mono text-xs text-[#3f4851]">{user.id}</td>
                    <td className="px-3.5 py-3 font-semibold text-[#171c1f]">{user.username}</td>
                    <td className="px-3.5 py-3 font-medium text-[#171c1f]">{user.name}</td>
                    <td className="px-3.5 py-3">
                      <span className={`ktv-chip ${user.chipClass}`}>{user.role}</span>
                    </td>
                    <td className="px-3.5 py-3 font-mono text-xs text-[#171c1f]">{user.phone}</td>
                    <td className="px-3.5 py-3 text-xs text-[#3f4851]">{user.lastLogin}</td>
                    <td className="px-3.5 py-3">
                      {isLocked ? (
                        <span className="ktv-chip ktv-chip-red">
                          <span className="ktv-dot" /> Bị khóa
                        </span>
                      ) : (
                        <span className="ktv-chip ktv-chip-green">
                          <span className="ktv-dot" /> Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit button */}
                        <button
                          className="ktv-btn-action ktv-btn-action-edit"
                          disabled={isLocked}
                          onClick={() => setEditUser(user)}
                          style={isLocked ? { cursor: 'not-allowed', opacity: 0.35 } : undefined}
                          title={isLocked ? 'Tài khoản đang bị khóa' : 'Chỉnh sửa tài khoản'}
                          type="button"
                        >
                          <svg
                            fill="none"
                            height="14"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="14"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>

                        {/* Reset password button */}
                        <button
                          className="ktv-btn-action ktv-btn-action-key"
                          disabled={isLocked}
                          onClick={() => setPassResetTarget(user.name)}
                          style={isLocked ? { cursor: 'not-allowed', opacity: 0.35 } : undefined}
                          title={isLocked ? 'Tài khoản đang bị khóa' : 'Cấp lại mật khẩu'}
                          type="button"
                        >
                          <svg
                            fill="none"
                            height="14"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="14"
                          >
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                          </svg>
                        </button>

                        {/* Lock / Unlock button */}
                        {isCurrent ? (
                          <>
                            <button
                              className="ktv-btn-action ktv-btn-action-lock"
                              disabled
                              style={{ cursor: 'not-allowed', opacity: 0.35 }}
                              title="Không thể tự khóa tài khoản của mình"
                              type="button"
                            >
                              <svg
                                fill="none"
                                height="14"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                width="14"
                              >
                                <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                              </svg>
                            </button>
                            <span className="ktv-chip ktv-chip-indigo text-[10.5px] px-2 py-0.5 opacity-85 flex items-center gap-1">
                              <svg
                                fill="none"
                                height="11"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                width="11"
                              >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                              Hiện tại
                            </span>
                          </>
                        ) : isLocked ? (
                          <button
                            className="ktv-btn-action ktv-btn-action-unlock"
                            onClick={() => handleToggleLock(user.id)}
                            title={`Mở khóa tài khoản ${user.username}`}
                            type="button"
                          >
                            <svg
                              fill="none"
                              height="14"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="14"
                            >
                              <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            className="ktv-btn-action ktv-btn-action-lock"
                            onClick={() => handleToggleLock(user.id)}
                            title={`Khóa tài khoản ${user.username}`}
                            type="button"
                          >
                            <svg
                              fill="none"
                              height="14"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="14"
                            >
                              <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="mt-3.5 flex items-center justify-between flex-wrap gap-2 text-xs text-[#707882]">
          <span>Hiển thị {filteredUsers.length} / 48 nhân viên</span>
          <div className="flex gap-1.5">
            <button className="px-3 py-1.5 border border-[#bfc7d2] hover:bg-[#f0f4f8] text-[#3f4851] rounded-md text-xs font-semibold transition" type="button">
              ‹ Trước
            </button>
            <button className="px-3 py-1.5 bg-[#006096] text-white rounded-md text-xs font-semibold shadow-sm" type="button">
              1
            </button>
            <button className="px-3 py-1.5 border border-[#bfc7d2] hover:bg-[#f0f4f8] text-[#3f4851] rounded-md text-xs font-semibold transition" type="button">
              2
            </button>
            <button className="px-3 py-1.5 border border-[#bfc7d2] hover:bg-[#f0f4f8] text-[#3f4851] rounded-md text-xs font-semibold transition" type="button">
              3
            </button>
            <button className="px-3 py-1.5 border border-[#bfc7d2] hover:bg-[#f0f4f8] text-[#3f4851] rounded-md text-xs font-semibold transition" type="button">
              Sau ›
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Thêm tài khoản */}
      {isAddModalOpen ? (
        <div className="ktv-modal-overlay">
          <div className="ktv-modal max-w-[520px]">
            <button
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f0f4f8] hover:bg-[#e4e9ed] text-[#707882] flex items-center justify-center text-sm font-semibold transition"
              onClick={() => setIsAddModalOpen(false)}
              type="button"
            >
              ✕
            </button>
            <div className="text-base font-bold text-[#171c1f] mb-1">
              Thêm tài khoản nhân viên mới
            </div>
            <div className="text-xs text-[#707882] mb-5">
              Điền đầy đủ thông tin. Nhân viên bắt buộc đổi mật khẩu khi đăng nhập lần đầu.
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#3f4851] mb-1">
                    Họ và tên <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15"
                    onChange={(e) => setAddForm({ ...addForm, fullname: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    required
                    type="text"
                    value={addForm.fullname}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3f4851] mb-1">
                    Tên đăng nhập (Username) <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15"
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    placeholder="a.nguyen"
                    required
                    type="text"
                    value={addForm.username}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#3f4851] mb-1">
                    Số điện thoại <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15"
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="09xx xxx xxx"
                    required
                    type="text"
                    value={addForm.phone}
                  />
                  <div className="text-[10px] text-[#707882] mt-1">10 số di động Việt Nam</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3f4851] mb-1">
                    Số CCCD (12 số) <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15"
                    maxLength={12}
                    onChange={(e) => setAddForm({ ...addForm, cccd: e.target.value })}
                    placeholder="012345678901"
                    type="text"
                    value={addForm.cccd}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#3f4851] mb-1">
                    Vai trò <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15 bg-white"
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    required
                    value={addForm.role}
                  >
                    <option value="">-- Chọn vai trò --</option>
                    <option value="Bác sĩ (doctor)">Bác sĩ (doctor)</option>
                    <option value="Điều dưỡng (nurse)">Điều dưỡng (nurse)</option>
                    <option value="Dược sĩ (pharmacist)">Dược sĩ (pharmacist)</option>
                    <option value="Kế toán (accountant)">Kế toán (accountant)</option>
                    <option value="Tiếp tân (receptionist)">Tiếp tân (receptionist)</option>
                    <option value="KTV IT (it_tech)">KTV IT (it_tech)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3f4851] mb-1">
                    Khoa / Phòng <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15 bg-white"
                    onChange={(e) => setAddForm({ ...addForm, dept: e.target.value })}
                    required
                    value={addForm.dept}
                  >
                    <option value="">-- Chọn khoa/phòng --</option>
                    <option value="Khoa Da liễu">Khoa Da liễu</option>
                    <option value="Khoa Nội">Khoa Nội</option>
                    <option value="Khoa Ngoại">Khoa Ngoại</option>
                    <option value="Khoa Xét nghiệm">Khoa Xét nghiệm</option>
                    <option value="Phòng Dược">Phòng Dược</option>
                    <option value="Phòng Kế toán">Phòng Kế toán</option>
                    <option value="Phòng IT">Phòng IT</option>
                  </select>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-[#3f4851] mb-1">
                  Mật khẩu khởi tạo
                </label>
                <div className="relative flex items-center">
                  <input
                    className="w-full pl-3 pr-10 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15"
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    type={showPassword ? 'text' : 'password'}
                    value={addForm.password}
                  />
                  <button
                    className="absolute right-2.5 p-1 text-[#707882] hover:text-[#006096]"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    type="button"
                  >
                    <svg
                      fill="none"
                      height="18"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="18"
                    >
                      {showPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" x2="23" y1="1" y2="23" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  className="px-4 py-2 border border-[#bfc7d2] hover:bg-[#f0f4f8] text-[#3f4851] rounded-lg text-xs font-semibold transition"
                  onClick={() => setIsAddModalOpen(false)}
                  type="button"
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 bg-[#006096] hover:bg-[#004f7e] text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  type="submit"
                >
                  ✓ Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal: Cấp lại mật khẩu */}
      {passResetTarget ? (
        <div className="ktv-modal-overlay">
          <div className="ktv-modal max-w-[420px] text-center">
            <button
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f0f4f8] hover:bg-[#e4e9ed] text-[#707882] flex items-center justify-center text-sm font-semibold transition"
              onClick={() => {
                setPassResetTarget(null);
                setCopiedPass(false);
              }}
              type="button"
            >
              ✕
            </button>
            <div className="mb-2.5 flex justify-center text-[#006096]">
              <svg
                fill="none"
                height="36"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="36"
              >
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <div className="text-base font-bold text-[#171c1f] mb-1">
              Cấp lại mật khẩu ngẫu nhiên
            </div>
            <div className="text-xs text-[#707882] mb-4">Nhân viên: {passResetTarget}</div>

            <div className="ktv-pass-reveal-box">
              <div className="ktv-pass-reveal-label flex items-center justify-center gap-1">
                <svg
                  fill="none"
                  height="11"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  width="11"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" x2="12" y1="9" y2="13" />
                  <line x1="12" x2="12.01" y1="17" y2="17" />
                </svg>
                Mật khẩu mới — chỉ hiển thị 1 lần
              </div>
              <div className="ktv-pass-reveal-value">Hm#7kP$2</div>
              <div className="ktv-pass-reveal-note">
                Ghi chép mật khẩu này trước khi đóng hộp thoại.
                <br />
                Hệ thống không lưu trữ mật khẩu này sau khi đóng.
              </div>
            </div>

            <div className="mt-4 flex gap-2.5 justify-center">
              <button
                className="px-3.5 py-2 bg-[#e8f4ff] text-[#006096] border border-[#cee5ff] hover:bg-[#cee5ff] rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText('Hm#7kP$2');
                  setCopiedPass(true);
                  setTimeout(() => setCopiedPass(false), 3000);
                }}
                type="button"
              >
                <svg
                  fill="none"
                  height="12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="12"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect height="4" rx="1" ry="1" width="8" x="8" y="2" />
                </svg>
                {copiedPass ? 'Đã sao chép!' : 'Sao chép'}
              </button>
              <button
                className="px-4 py-2 bg-[#006096] hover:bg-[#004f7e] text-white rounded-lg text-xs font-semibold shadow-sm transition"
                onClick={() => setPassResetTarget(null)}
                type="button"
              >
                ✓ Đã bàn giao — Đóng
              </button>
            </div>

            <div className="text-[11px] text-[#707882] mt-3">
              Hành động này đã được ghi vào Audit Log · 18/07/2026 08:05:00
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal: Edit User */}
      {editUser ? (
        <div className="ktv-modal-overlay">
          <div className="ktv-modal max-w-[480px]">
            <button
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f0f4f8] hover:bg-[#e4e9ed] text-[#707882] flex items-center justify-center text-sm font-semibold transition"
              onClick={() => setEditUser(null)}
              type="button"
            >
              ✕
            </button>
            <div className="text-base font-bold text-[#171c1f] mb-1">
              Chỉnh sửa tài khoản nhân viên
            </div>
            <div className="text-xs text-[#707882] mb-4">
              Mã NV: <span className="font-mono font-bold text-[#006096]">{editUser.id}</span> — Username: <span className="font-bold text-[#171c1f]">{editUser.username}</span>
            </div>

            <form onSubmit={handleSaveEditUser}>
              <div className="mb-3.5">
                <label className="block text-xs font-semibold text-[#3f4851] mb-1">
                  Họ và tên
                </label>
                <input
                  className="w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15"
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  required
                  type="text"
                  value={editUser.name}
                />
              </div>

              <div className="mb-3.5">
                <label className="block text-xs font-semibold text-[#3f4851] mb-1">
                  Số điện thoại
                </label>
                <input
                  className="w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15"
                  onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                  required
                  type="text"
                  value={editUser.phone}
                />
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-[#3f4851] mb-1">
                  Vai trò
                </label>
                <select
                  className="w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15 bg-white"
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  value={editUser.role}
                >
                  <option value="Bác sĩ">Bác sĩ</option>
                  <option value="Điều dưỡng">Điều dưỡng</option>
                  <option value="Dược sĩ">Dược sĩ</option>
                  <option value="Kế toán">Kế toán</option>
                  <option value="KTV IT">KTV IT</option>
                </select>
              </div>

              <div className="flex gap-2.5 justify-end">
                <button
                  className="px-4 py-2 border border-[#bfc7d2] hover:bg-[#f0f4f8] text-[#3f4851] rounded-lg text-xs font-semibold transition"
                  onClick={() => setEditUser(null)}
                  type="button"
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 bg-[#006096] hover:bg-[#004f7e] text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  type="submit"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BackupContent() {
  return (
    <div className="min-w-[1080px] space-y-6 p-8">
      <PageHeader
        actions={(
          <>
            <button className={styles.secondaryButton} type="button">
              <Icon className="h-4 w-4" name="download" />
              Tải bản sao lưu
            </button>
            <button className={styles.primaryButton} type="button">
              <Icon className="h-4 w-4" name="database" />
              Tạo sao lưu ngay
            </button>
          </>
        )}
        subtitle="Theo dõi lịch sao lưu, dung lượng bản ghi và trạng thái khôi phục dữ liệu."
        title="Sao lưu & Khôi phục"
      />
      <section className="grid grid-cols-3 gap-6">
        <SummaryCardView card={{ helper: '03:30 mỗi ngày', label: 'Lịch sao lưu', tone: 'sky', value: 'Auto' }} />
        <SummaryCardView card={{ helper: 'Bản gần nhất 1.24 GB', label: 'Dung lượng', tone: 'teal', value: '18.6 GB' }} />
        <SummaryCardView card={{ helper: 'Không có lỗi phát sinh', label: 'Trạng thái', tone: 'green', value: 'Ổn định' }} />
      </section>
      <section className={cn(styles.card, 'overflow-hidden')}>
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className={styles.sectionTitle}>Lịch sử sao lưu gần nhất</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-[0.5px] text-slate-600">
            <tr>
              {['Thời gian', 'Tên file', 'Dung lượng', 'Loại', 'Trạng thái'].map((head) => (
                <th className="px-6 py-4" key={head}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              ['2026-07-18 03:30:00', 'hms_backup_20260718_030000.sql', '1.24 GB', 'Tự động', 'Hoàn thành'],
              ['2026-07-17 03:30:00', 'hms_backup_20260717_030000.sql', '1.21 GB', 'Tự động', 'Hoàn thành'],
              ['2026-07-16 22:15:11', 'hms_manual_before_release.sql', '1.20 GB', 'Thủ công', 'Hoàn thành'],
            ].map((row) => (
              <tr key={row[1]}>
                <td className="px-6 py-4 font-mono text-xs">{row[0]}</td>
                <td className="px-6 py-4 font-mono text-xs font-bold">{row[1]}</td>
                <td className="px-6 py-4 text-xs">{row[2]}</td>
                <td className="px-6 py-4 text-xs">{row[3]}</td>
                <td className="px-6 py-4"><ToneBadge tone="green">{row[4]}</ToneBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function ItTechnicianContent({ activePage }: { activePage: PageKind }) {
  if (activePage === 'audit') return <AuditContent />;
  if (activePage === 'users') return <UsersContent />;
  if (activePage === 'rbac') return <RbacContent />;
  if (activePage === 'backup') return <BackupContent />;

  return <MonitoringContent />;
}

export function ItTechnicianWorkspace() {
  const [activePage, setActivePage] = useState<PageKind>('monitoring');

  return (
    <ItShell activePage={activePage} onChangePage={setActivePage}>
      <ItTechnicianContent activePage={activePage} />
    </ItShell>
  );
}
