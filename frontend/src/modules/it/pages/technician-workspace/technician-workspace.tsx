'use client';

import Image from 'next/image';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { ApiError } from '@/shared/api-client';
import { LogoutButton } from '@/shared/auth/logout-button';

import { itTechnicianWorkspaceStyles as styles } from './technician-workspace.styles';
import {
  useCreateStaffUser,
  useResetStaffPassword,
  useStaffUsers,
  useUpdateStaffUser,
} from '../../hooks/use-staff-users';
import {
  createStaffFormSchema,
  editStaffFormSchema,
  getCreateStaffValidationFieldErrors,
  getEditStaffValidationFieldErrors,
  normalizeCreateStaffFieldErrors,
  normalizeEditStaffFieldErrors,
  toCreateStaffInput,
  toUpdateStaffInput,
  type CreateStaffFormField,
  type CreateStaffFormFieldErrors,
  type CreateStaffFormValues,
  type EditStaffFormField,
  type EditStaffFormFieldErrors,
} from '../../types/staff-form.schema';
import type { DepartmentCode, RoleCode, StaffUser as ApiStaffUser } from '../../types/staff.schema';

type PageKind = 'monitoring' | 'audit' | 'users' | 'rbac' | 'backup';
type NotificationTone = 'error' | 'success';
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

type PopupNotification = {
  message: string;
  title: string;
  tone: NotificationTone;
};

type ItPrincipal = {
  roleCodes: string[];
};

type RoleOption = {
  code: RoleCode;
  label: string;
  value: RoleCode;
};

type DepartmentOption = {
  label: string;
  value: DepartmentCode;
};

type TemporaryPasswordDialog = {
  source: 'create' | 'reset';
  targetName: string;
  temporaryPassword: string;
};

type ItTechnicianWorkspaceProps = {
  principal: ItPrincipal;
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

/**
 * Chọn nhóm class theo trạng thái thông báo.
 * Nhận tone của popup, trả về class màu cho border, icon và text.
 */
function getNotificationClasses(tone: NotificationTone) {
  if (tone === 'success') {
    return {
      border: 'border-emerald-200',
      icon: 'bg-emerald-50 text-emerald-700',
      text: 'text-emerald-700',
    };
  }

  return {
    border: 'border-red-200',
    icon: 'bg-red-50 text-red-700',
    text: 'text-red-700',
  };
}

/**
 * Hiển thị popup thông báo thao tác quản trị, thay thế alert native của trình duyệt.
 * Nhận nội dung thông báo và callback đóng, không gọi API và không tự thay đổi server state.
 */
function NotificationPopup({
  notification,
  onClose,
}: {
  notification: PopupNotification;
  onClose: () => void;
}) {
  const toneClass = getNotificationClasses(notification.tone);

  return (
    <div
      className="fixed right-5 top-5 z-50 w-[min(360px,calc(100vw-40px))]"
      role={notification.tone === 'error' ? 'alert' : 'status'}
    >
      <div className={cn('rounded-xl border bg-white p-4 shadow-2xl', toneClass.border)}>
        <div className="flex items-start gap-3">
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', toneClass.icon)}>
            <Icon className="h-5 w-5" name={notification.tone === 'success' ? 'check' : 'alert'} />
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-bold leading-5', toneClass.text)}>{notification.title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{notification.message}</p>
          </div>
          <button
            aria-label="Đóng thông báo"
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>
    </div>
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
          <LogoutButton className="rounded-md border border-white/10 p-2 text-white/90">
            <Icon className="h-4 w-4" name="logOut" />
          </LogoutButton>
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
  apiId?: string;
  username: string;
  name: string;
  role: string;
  roleCode: RoleCode;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  cccd?: string;
  dept?: string;
  deptCode?: string;
  lastLogin: string;
  status: 'active' | 'locked' | 'current';
  chipClass: string;
  updatedAt?: string;
}

const roleLabelByCode: Record<string, string> = {
  admin: 'Quản trị viên',
  accountant: 'Kế toán',
  director: 'Giám đốc',
  doctor: 'Bác sĩ',
  it_tech: 'KTV IT',
  lab_tech: 'KTV xét nghiệm',
  nurse: 'Điều dưỡng',
  pharmacist: 'Dược sĩ',
  receptionist: 'Tiếp tân',
};

const chipClassByRoleCode: Record<string, string> = {
  admin: 'ktv-chip-red',
  accountant: 'ktv-chip-purple',
  director: 'ktv-chip-slate',
  doctor: 'ktv-chip-blue',
  it_tech: 'ktv-chip-indigo',
  lab_tech: 'ktv-chip-indigo',
  nurse: 'ktv-chip-teal',
  pharmacist: 'ktv-chip-amber',
  receptionist: 'ktv-chip-green',
};

const managedRoleOptions: RoleOption[] = [
  { code: 'doctor', label: 'Bác sĩ (doctor)', value: 'doctor' },
  { code: 'nurse', label: 'Điều dưỡng (nurse)', value: 'nurse' },
  { code: 'pharmacist', label: 'Dược sĩ (pharmacist)', value: 'pharmacist' },
  { code: 'accountant', label: 'Kế toán (accountant)', value: 'accountant' },
  { code: 'receptionist', label: 'Tiếp tân (receptionist)', value: 'receptionist' },
  { code: 'lab_tech', label: 'KTV xét nghiệm (lab_tech)', value: 'lab_tech' },
];

const adminRoleOptions: RoleOption[] = [
  { code: 'admin', label: 'Quản trị viên (admin)', value: 'admin' },
  ...managedRoleOptions,
  { code: 'it_tech', label: 'KTV IT (it_tech)', value: 'it_tech' },
  { code: 'director', label: 'Giám đốc (director)', value: 'director' },
];

const departmentOptions: DepartmentOption[] = [
  { label: 'Khoa Da liễu', value: 'dermatology' },
  { label: 'Khoa Lâm sàng', value: 'clinical' },
  { label: 'Khoa Xét nghiệm', value: 'laboratory' },
  { label: 'Phòng Dược', value: 'pharmacy' },
  { label: 'Phòng Kế toán', value: 'accounting' },
  { label: 'Quầy Tiếp tân', value: 'reception' },
  { label: 'Phòng IT', value: 'it' },
];

const defaultCreateStaffForm: CreateStaffFormValues = {
  dateOfBirth: '',
  departmentId: '',
  fullName: '',
  gender: '',
  identityCardNumber: '',
  phoneNumber: '',
  roleCode: '',
  username: '',
};

const staffUsersPageSize = 20;

const createStaffFieldIds: Record<CreateStaffFormField, string> = {
  dateOfBirth: 'create-staff-date-of-birth',
  departmentId: 'create-staff-department-id',
  fullName: 'create-staff-full-name',
  gender: 'create-staff-gender',
  identityCardNumber: 'create-staff-identity-card-number',
  phoneNumber: 'create-staff-phone-number',
  roleCode: 'create-staff-role-code',
  username: 'create-staff-username',
};

const editStaffFieldIds: Record<EditStaffFormField, string> = {
  dateOfBirth: 'edit-staff-date-of-birth',
  departmentId: 'edit-staff-department-id',
  fullName: 'edit-staff-full-name',
  gender: 'edit-staff-gender',
  identityCardNumber: 'edit-staff-identity-card-number',
  isActive: 'edit-staff-is-active',
  phoneNumber: 'edit-staff-phone-number',
  roleCode: 'edit-staff-role-code',
  username: 'edit-staff-username',
};

/**
 * Xác định danh sách role actor được phép gán trên UI.
 * Nhận principal từ server guard, trả role đầy đủ cho admin hoặc subset nghiệp vụ cho it_tech.
 */
const getManageableRoleOptions = (principal: ItPrincipal) =>
  principal.roleCodes.includes('admin') ? adminRoleOptions : managedRoleOptions;

/**
 * Định dạng thời điểm đăng nhập cuối cho bảng nhân viên.
 * Nhận ISO string hoặc null từ API, trả chuỗi tiếng Việt dễ đọc cho UI.
 */
const formatLastLogin = (value: string | null) =>
  value ? new Date(value).toLocaleString('vi-VN') : 'Chưa đăng nhập';

/**
 * Chuẩn hóa ngày sinh từ ISO/backend DATE về dạng yyyy-MM-dd để hiển thị trong input ngày.
 */
const formatDateInputValue = (value: string) => value.slice(0, 10);

const getResetPasswordReason = (username: string) =>
  `Cấp lại mật khẩu tài khoản ${username} theo yêu cầu hỗ trợ hợp lệ`;

const getFirstFieldError = (
  fieldErrors: CreateStaffFormFieldErrors,
  field: CreateStaffFormField,
) => fieldErrors[field]?.[0];

const getFieldErrorId = (field: CreateStaffFormField) => `${createStaffFieldIds[field]}-error`;

const getFieldDescriptionId = (field: CreateStaffFormField) =>
  `${createStaffFieldIds[field]}-description`;

const getFieldDescribedBy = (
  fieldErrors: CreateStaffFormFieldErrors,
  field: CreateStaffFormField,
  hasDescription = false,
) =>
  [
    hasDescription ? getFieldDescriptionId(field) : undefined,
    getFirstFieldError(fieldErrors, field) ? getFieldErrorId(field) : undefined,
  ].filter(Boolean).join(' ') || undefined;

const getEditFieldErrorId = (field: EditStaffFormField) => `${editStaffFieldIds[field]}-error`;

const getFirstEditFieldError = (
  fieldErrors: EditStaffFormFieldErrors,
  field: EditStaffFormField,
) => fieldErrors[field]?.[0];

const getEditFieldDescribedBy = (
  fieldErrors: EditStaffFormFieldErrors,
  field: EditStaffFormField,
) => (getFirstEditFieldError(fieldErrors, field) ? getEditFieldErrorId(field) : undefined);

/**
 * Map StaffUser từ API sang model trình bày của workspace IT.
 * Nhận payload đã parse bằng Zod, trả item không chứa password và có metadata chỉnh sửa.
 */
const mapApiStaffUserToItem = (user: ApiStaffUser): StaffUserItem => {
  const roleCode = user.roleCodes[0];

  return {
    apiId: user.id,
    cccd: user.identityCardNumber,
    chipClass: chipClassByRoleCode[roleCode] ?? 'ktv-chip-blue',
    dateOfBirth: formatDateInputValue(user.dateOfBirth),
    dept: user.departmentId,
    deptCode: user.departmentId,
    gender: user.gender,
    id: user.id.slice(0, 8).toUpperCase(),
    lastLogin: formatLastLogin(user.lastLoginAt),
    name: user.fullName,
    phone: user.phoneNumber,
    role: roleLabelByCode[roleCode] ?? roleCode,
    roleCode,
    status: user.isActive ? 'active' : 'locked',
    updatedAt: user.updatedAt,
    username: user.username,
  };
};

/**
 * Điều phối màn hình quản lý tài khoản nhân viên cho IT/admin.
 * Nhận principal đã xác thực từ server page, gọi API qua React Query và giữ secret tạm trong state ngắn hạn.
 */
function UsersContent({ principal }: { principal: ItPrincipal }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [temporaryPasswordDialog, setTemporaryPasswordDialog] =
    useState<TemporaryPasswordDialog | null>(null);
  const [editUser, setEditUser] = useState<StaffUserItem | null>(null);
  const [addForm, setAddForm] = useState<CreateStaffFormValues>(defaultCreateStaffForm);
  const [addFieldErrors, setAddFieldErrors] = useState<CreateStaffFormFieldErrors>({});
  const [editFieldErrors, setEditFieldErrors] = useState<EditStaffFormFieldErrors>({});
  const [addFormError, setAddFormError] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [copiedPass, setCopiedPass] = useState(false);
  const [notification, setNotification] = useState<PopupNotification | null>(null);
  const addAccountButtonRef = useRef<HTMLButtonElement>(null);
  const firstAddFieldRef = useRef<HTMLInputElement>(null);
  const notificationTimer = useRef<number | null>(null);
  const copyTimer = useRef<number | null>(null);
  const staffQuery = useStaffUsers({ page: currentPage, pageSize: staffUsersPageSize, q: searchQuery });
  const activeStaffCountQuery = useStaffUsers({
    isActive: true,
    page: 1,
    pageSize: 1,
    q: searchQuery,
  });
  const lockedStaffCountQuery = useStaffUsers({
    isActive: false,
    page: 1,
    pageSize: 1,
    q: searchQuery,
  });
  const createMutation = useCreateStaffUser();
  const updateMutation = useUpdateStaffUser();
  const resetMutation = useResetStaffPassword();
  const users = staffQuery.data?.items.map(mapApiStaffUserToItem) ?? [];
  const totalStaffUsers = staffQuery.data?.totalItems ?? users.length;
  const totalStaffPages = staffQuery.data?.totalPages ?? 1;
  const startPage = Math.min(Math.max(currentPage - 2, 1), Math.max(totalStaffPages - 4, 1));
  const pageNumbers = Array.from(
    { length: Math.min(totalStaffPages, 5) },
    (_, index) => startPage + index,
  );
  const activeCount = activeStaffCountQuery.data?.totalItems ?? 0;
  const lockedCount = lockedStaffCountQuery.data?.totalItems ?? 0;
  const roleOptions = getManageableRoleOptions(principal);

  /** Mở popup thông báo ngắn và tự ẩn để không chặn luồng nhập liệu của kỹ thuật IT. */
  const showNotification = (nextNotification: PopupNotification) => {
    if (notificationTimer.current) {
      window.clearTimeout(notificationTimer.current);
    }

    setNotification(nextNotification);
    notificationTimer.current = window.setTimeout(() => {
      setNotification(null);
      notificationTimer.current = null;
    }, 3600);
  };

  useEffect(() => () => {
    if (notificationTimer.current) {
      window.clearTimeout(notificationTimer.current);
    }

    if (copyTimer.current) {
      window.clearTimeout(copyTimer.current);
    }
  }, []);

  /**
   * Đóng dialog bàn giao mật khẩu và xóa secret tạm khỏi React state.
   * Không gửi request mới, chỉ dọn trạng thái UI sau khi IT đã bàn giao mật khẩu.
   */
  const closeTemporaryPasswordDialog = () => {
    if (copyTimer.current) {
      window.clearTimeout(copyTimer.current);
      copyTimer.current = null;
    }

    setTemporaryPasswordDialog(null);
    setCopiedPass(false);
  };

  const resetAddFormState = () => {
    setAddForm(defaultCreateStaffForm);
    setAddFieldErrors({});
    setAddFormError('');
  };

  const openAddModal = () => {
    resetAddFormState();
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    if (createMutation.isPending) return;

    setIsAddModalOpen(false);
    resetAddFormState();
    addAccountButtonRef.current?.focus();
  };

  const updateAddFormField = (field: CreateStaffFormField, value: string) => {
    setAddForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setAddFormError('');
    setAddFieldErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors;

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];

      return nextErrors;
    });
  };

  const renderCreateStaffFieldError = (field: CreateStaffFormField) => {
    const error = getFirstFieldError(addFieldErrors, field);

    return error ? (
      <p className="mt-1 text-[10px] font-semibold text-red-700" id={getFieldErrorId(field)}>
        {error}
      </p>
    ) : null;
  };

  const handleCopyTemporaryPassword = async () => {
    if (!temporaryPasswordDialog) return;

    try {
      await navigator.clipboard.writeText(temporaryPasswordDialog.temporaryPassword);
      setCopiedPass(true);

      if (copyTimer.current) {
        window.clearTimeout(copyTimer.current);
      }

      copyTimer.current = window.setTimeout(() => {
        setCopiedPass(false);
        copyTimer.current = null;
      }, 3000);
    } catch {
      showNotification({
        message: 'Trình duyệt chưa cho phép sao chép tự động, vui lòng sao chép thủ công.',
        title: 'Chưa thể sao chép',
        tone: 'error',
      });
    }
  };

  useEffect(() => {
    if (!isAddModalOpen) return;

    firstAddFieldRef.current?.focus();
  }, [isAddModalOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (temporaryPasswordDialog) {
        if (copyTimer.current) {
          window.clearTimeout(copyTimer.current);
          copyTimer.current = null;
        }

        setTemporaryPasswordDialog(null);
        setCopiedPass(false);
        return;
      }

      if (isAddModalOpen && !createMutation.isPending) {
        setIsAddModalOpen(false);
        setAddForm(defaultCreateStaffForm);
        setAddFieldErrors({});
        setAddFormError('');
        addAccountButtonRef.current?.focus();
        return;
      }

      if (editUser && !updateMutation.isPending) {
        setEditUser(null);
        setEditFieldErrors({});
        setEditFormError('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    createMutation.isPending,
    editUser,
    isAddModalOpen,
    temporaryPasswordDialog,
    updateMutation.isPending,
  ]);

  /**
   * Khóa hoặc mở khóa tài khoản nhân viên bằng optimistic lock từ updatedAt.
   * Nhận row đang hiển thị, gọi mutation PATCH và báo lỗi nếu backend từ chối.
   */
  const handleToggleLock = async (user: StaffUserItem) => {
    if (!user.apiId || !user.updatedAt || user.status === 'current') return;

    try {
      await updateMutation.mutateAsync({
        ifUnmodifiedSince: user.updatedAt,
        input: {
          isActive: user.status === 'locked',
        },
        userId: user.apiId,
      });
    } catch (caught) {
      showNotification({
        message: caught instanceof Error ? caught.message : 'Không thể cập nhật trạng thái tài khoản',
        title: 'Thao tác chưa thành công',
        tone: 'error',
      });
    }
  };

  /**
   * Cập nhật state form edit theo field được phép sửa và xóa lỗi cũ của field đó.
   */
  const updateEditUserField = (field: EditStaffFormField, value: string | boolean) => {
    if (!editUser) return;

    setEditUser((currentUser) => {
      if (!currentUser) return currentUser;

      if (field === 'fullName') {
        return { ...currentUser, name: String(value) };
      }

      if (field === 'username') {
        return { ...currentUser, username: String(value) };
      }

      if (field === 'phoneNumber') {
        return { ...currentUser, phone: String(value) };
      }

      if (field === 'identityCardNumber') {
        return { ...currentUser, cccd: String(value) };
      }

      if (field === 'dateOfBirth') {
        return { ...currentUser, dateOfBirth: String(value) };
      }

      if (field === 'gender') {
        return { ...currentUser, gender: String(value) as StaffUserItem['gender'] };
      }

      if (field === 'departmentId') {
        return { ...currentUser, dept: String(value), deptCode: String(value) };
      }

      if (field === 'roleCode') {
        const roleCode = String(value) as RoleCode;

        return {
          ...currentUser,
          chipClass: chipClassByRoleCode[roleCode] ?? currentUser.chipClass,
          role: roleLabelByCode[roleCode] ?? roleCode,
          roleCode,
        };
      }

      return { ...currentUser, status: value ? 'active' : 'locked' };
    });
    setEditFormError('');
    setEditFieldErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors;

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];

      return nextErrors;
    });
  };

  /**
   * Hiển thị lỗi validation cạnh input trong modal chỉnh sửa tài khoản.
   */
  const renderEditStaffFieldError = (field: EditStaffFormField) => {
    const error = getFirstEditFieldError(editFieldErrors, field);

    return error ? (
      <p className="mt-1 text-[10px] font-semibold text-red-700" id={getEditFieldErrorId(field)}>
        {error}
      </p>
    ) : null;
  };

  /**
   * Tạo tài khoản nhân viên từ form IT và hiển thị mật khẩu tạm một lần.
   * Nhận submit event, gọi API create staff và chỉ lưu temporaryPassword tới khi dialog đóng.
   */
  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createMutation.isPending) return;

    setAddFormError('');
    setAddFieldErrors({});

    const parsedForm = createStaffFormSchema.safeParse(addForm);
    if (!parsedForm.success) {
      const fieldErrors = getCreateStaffValidationFieldErrors(parsedForm.error);

      setAddFieldErrors(fieldErrors);
      setAddFormError('Vui lòng kiểm tra lại các trường đang báo lỗi.');
      showNotification({
        message: 'Vui lòng điền đầy đủ và đúng định dạng các thông tin bắt buộc (*).',
        title: 'Thông tin chưa hợp lệ',
        tone: 'error',
      });
      return;
    }

    const selectedRole = roleOptions.some((option) => option.value === parsedForm.data.roleCode);
    if (!selectedRole) {
      setAddFieldErrors({
        roleCode: ['Vai trò này nằm ngoài phạm vi quản lý của tài khoản hiện tại'],
      });
      setAddFormError('Tài khoản hiện tại không đủ quyền gán vai trò đã chọn.');
      return;
    }

    try {
      const result = await createMutation.mutateAsync(toCreateStaffInput(parsedForm.data));

      setTemporaryPasswordDialog({
        source: 'create',
        targetName: result.user.fullName,
        temporaryPassword: result.temporaryPassword,
      });
      showNotification({
        message: `Đã tạo thành công tài khoản cho ${result.user.fullName}.`,
        title: 'Tạo tài khoản thành công',
        tone: 'success',
      });
      setIsAddModalOpen(false);
      resetAddFormState();
      return;
    } catch (caught) {
      if (caught instanceof ApiError && caught.hasFieldErrors) {
        setAddFieldErrors(normalizeCreateStaffFieldErrors(caught.fields ?? {}));
      }

      setAddFormError(caught instanceof Error ? caught.message : 'Không thể tạo tài khoản nhân viên');
      return;
    }
  };

  /**
   * Lưu thay đổi hồ sơ/role nhân viên đang edit bằng updatedAt làm khóa lạc quan.
   * Nhận submit event, gọi API update và giữ lỗi validation trong form hiện tại.
   */
  const handleSaveEditUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editUser || updateMutation.isPending) return;
    setEditFormError('');
    setEditFieldErrors({});

    if (editUser.apiId && editUser.updatedAt) {
      const parsedForm = editStaffFormSchema.safeParse({
        dateOfBirth: editUser.dateOfBirth,
        departmentId: editUser.deptCode ?? '',
        fullName: editUser.name,
        gender: editUser.gender,
        identityCardNumber: editUser.cccd ?? '',
        isActive: editUser.status === 'active',
        phoneNumber: editUser.phone,
        roleCode: editUser.roleCode,
        username: editUser.username,
      });

      if (!parsedForm.success) {
        setEditFieldErrors(getEditStaffValidationFieldErrors(parsedForm.error));
        setEditFormError('Vui lòng kiểm tra lại các trường đang báo lỗi.');
        showNotification({
          message: 'Thông tin cập nhật chưa hợp lệ, vui lòng kiểm tra các trường bắt buộc.',
          title: 'Chưa thể lưu thay đổi',
          tone: 'error',
        });
        return;
      }

      const selectedRole = roleOptions.some((option) => option.value === parsedForm.data.roleCode);
      if (!selectedRole) {
        setEditFieldErrors({
          roleCode: ['Vai trò này nằm ngoài phạm vi quản lý của tài khoản hiện tại'],
        });
        setEditFormError('Tài khoản hiện tại không đủ quyền gán vai trò đã chọn.');
        return;
      }

      void updateMutation
        .mutateAsync({
          ifUnmodifiedSince: editUser.updatedAt,
          input: toUpdateStaffInput(parsedForm.data),
          userId: editUser.apiId,
        })
        .then((updatedUser) => {
          setEditUser(null);
          setEditFieldErrors({});
          showNotification({
            message: `Đã cập nhật thành công tài khoản ${updatedUser.fullName}.`,
            title: 'Cập nhật tài khoản thành công',
            tone: 'success',
          });
        })
        .catch((caught: unknown) => {
          if (caught instanceof ApiError && caught.hasFieldErrors) {
            setEditFieldErrors(normalizeEditStaffFieldErrors(caught.fields ?? {}));
          }

          setEditFormError(caught instanceof Error ? caught.message : 'Không thể cập nhật tài khoản');
        });
      return;
    }

    showNotification({
      message: 'Tài khoản chưa có định danh API, vui lòng tải lại dữ liệu từ backend.',
      title: 'Không thể cập nhật',
      tone: 'error',
    });
  };

  return (
    <div className="min-w-[1080px] space-y-5 p-6 font-sans text-slate-800">
      {notification ? (
        <NotificationPopup notification={notification} onClose={() => setNotification(null)} />
      ) : null}

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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên, username, SĐT..."
              type="text"
              value={searchQuery}
            />
          </div>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006096] hover:bg-[#004f7e] text-white text-xs font-semibold rounded-lg shadow-sm transition whitespace-nowrap"
            onClick={openAddModal}
            ref={addAccountButtonRef}
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
          <div className="ktv-stat-mini-value">
            {staffQuery.isLoading ? '...' : totalStaffUsers}
          </div>
        </div>
        <div className="ktv-stat-mini">
          <div className="ktv-stat-mini-label">Đang hoạt động</div>
          <div className="ktv-stat-mini-value" style={{ color: '#1b6e3c' }}>
            {activeStaffCountQuery.isLoading ? '...' : activeCount}
          </div>
        </div>
        <div className="ktv-stat-mini">
          <div className="ktv-stat-mini-label">Bị khóa</div>
          <div className="ktv-stat-mini-value" style={{ color: '#ba1a1a' }}>
            {lockedStaffCountQuery.isLoading ? '...' : lockedCount}
          </div>
        </div>
        <div className="ktv-stat-mini">
          <div className="ktv-stat-mini-label">Đang hiển thị</div>
          <div className="ktv-stat-mini-value" style={{ color: '#006096' }}>
            {staffQuery.isLoading ? '...' : users.length}
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
              {staffQuery.isLoading ? (
                <tr>
                  <td className="px-3.5 py-8 text-center text-xs font-semibold text-[#707882]" colSpan={8}>
                    Đang tải danh sách tài khoản từ API...
                  </td>
                </tr>
              ) : null}
              {staffQuery.isError ? (
                <tr>
                  <td className="px-3.5 py-8 text-center text-xs font-semibold text-[#ba1a1a]" colSpan={8}>
                    Không thể tải danh sách tài khoản nhân viên từ hệ thống.
                  </td>
                </tr>
              ) : null}
              {!staffQuery.isLoading && !staffQuery.isError && users.length === 0 ? (
                <tr>
                  <td className="px-3.5 py-8 text-center text-xs font-semibold text-[#707882]" colSpan={8}>
                    Không có tài khoản nhân viên phù hợp.
                  </td>
                </tr>
              ) : null}
              {!staffQuery.isLoading && !staffQuery.isError ? users.map((user) => {
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
                          onClick={() => {
                            setEditFormError('');
                            setEditFieldErrors({});
                            setEditUser(user);
                          }}
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
                          onClick={() => {
                            if (!user.apiId) {
                              showNotification({
                                message: 'Tài khoản chưa có định danh API, vui lòng tải lại dữ liệu từ backend.',
                                title: 'Không thể cấp lại mật khẩu',
                                tone: 'error',
                              });
                              return;
                            }

                            void resetMutation
                              .mutateAsync({
                                reason: getResetPasswordReason(user.username),
                                userId: user.apiId,
                              })
                              .then((result) => {
                                setTemporaryPasswordDialog({
                                  source: 'reset',
                                  targetName: result.user.fullName,
                                  temporaryPassword: result.temporaryPassword,
                                });
                              })
                              .catch((caught: unknown) => {
                                showNotification({
                                  message: caught instanceof Error ? caught.message : 'Không thể cấp lại mật khẩu',
                                  title: 'Cấp lại mật khẩu thất bại',
                                  tone: 'error',
                                });
                              });
                          }}
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
                            onClick={() => void handleToggleLock(user)}
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
                            onClick={() => void handleToggleLock(user)}
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
              }) : null}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="mt-3.5 flex items-center justify-between flex-wrap gap-2 text-xs text-[#707882]">
          <span>Hiển thị {users.length} / {totalStaffUsers} nhân viên</span>
          <div className="flex gap-1.5">
            <button
              className="px-3 py-1.5 border border-[#bfc7d2] hover:bg-[#f0f4f8] text-[#3f4851] rounded-md text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              disabled={currentPage <= 1 || staffQuery.isLoading}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              ‹ Trước
            </button>
            {pageNumbers.map((page) => (
              <button
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold transition',
                  page === currentPage
                    ? 'bg-[#006096] text-white shadow-sm'
                    : 'border border-[#bfc7d2] text-[#3f4851] hover:bg-[#f0f4f8]',
                )}
                disabled={staffQuery.isLoading}
                key={page}
                onClick={() => setCurrentPage(page)}
                type="button"
              >
                {page}
              </button>
            ))}
            <button
              className="px-3 py-1.5 border border-[#bfc7d2] hover:bg-[#f0f4f8] text-[#3f4851] rounded-md text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              disabled={currentPage >= totalStaffPages || staffQuery.isLoading}
              onClick={() => setCurrentPage((page) => Math.min(totalStaffPages, page + 1))}
              type="button"
            >
              Sau ›
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Thêm tài khoản */}
      {isAddModalOpen ? (
        <div className="ktv-modal-overlay">
          <div
            aria-describedby="create-staff-dialog-description"
            aria-labelledby="create-staff-dialog-title"
            aria-modal="true"
            className="ktv-modal max-h-[calc(100vh-40px)] max-w-[520px] overflow-y-auto"
            role="dialog"
          >
            <button
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f0f4f8] hover:bg-[#e4e9ed] text-[#707882] flex items-center justify-center text-sm font-semibold transition"
              aria-label="Đóng form thêm tài khoản"
              disabled={createMutation.isPending}
              onClick={closeAddModal}
              type="button"
            >
              ✕
            </button>
            <div className="text-base font-bold text-[#171c1f] mb-1" id="create-staff-dialog-title">
              Thêm tài khoản nhân viên mới
            </div>
            <div className="text-xs text-[#707882] mb-5" id="create-staff-dialog-description">
              Điền đầy đủ thông tin. Nhân viên bắt buộc đổi mật khẩu khi đăng nhập lần đầu.
            </div>

            <form noValidate onSubmit={handleCreateUser}>
              <div className="grid grid-cols-1 gap-3.5 mb-3.5 sm:grid-cols-2">
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={createStaffFieldIds.fullName}
                  >
                    Họ và tên <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    aria-describedby={getFieldDescribedBy(addFieldErrors, 'fullName')}
                    aria-invalid={Boolean(getFirstFieldError(addFieldErrors, 'fullName'))}
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15',
                      getFirstFieldError(addFieldErrors, 'fullName') && 'border-red-300 bg-red-50/30',
                    )}
                    id={createStaffFieldIds.fullName}
                    name="fullName"
                    onChange={(event) => updateAddFormField('fullName', event.target.value)}
                    placeholder="Nguyễn Văn A"
                    ref={firstAddFieldRef}
                    required
                    type="text"
                    value={addForm.fullName}
                  />
                  {renderCreateStaffFieldError('fullName')}
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={createStaffFieldIds.username}
                  >
                    Tên đăng nhập (Username) <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    aria-describedby={getFieldDescribedBy(addFieldErrors, 'username')}
                    aria-invalid={Boolean(getFirstFieldError(addFieldErrors, 'username'))}
                    autoComplete="username"
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15',
                      getFirstFieldError(addFieldErrors, 'username') && 'border-red-300 bg-red-50/30',
                    )}
                    id={createStaffFieldIds.username}
                    name="username"
                    onChange={(event) => updateAddFormField('username', event.target.value)}
                    placeholder="a.nguyen"
                    required
                    type="text"
                    value={addForm.username}
                  />
                  {renderCreateStaffFieldError('username')}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 mb-3.5 sm:grid-cols-2">
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={createStaffFieldIds.phoneNumber}
                  >
                    Số điện thoại <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    aria-describedby={getFieldDescribedBy(addFieldErrors, 'phoneNumber', true)}
                    aria-invalid={Boolean(getFirstFieldError(addFieldErrors, 'phoneNumber'))}
                    autoComplete="tel"
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15',
                      getFirstFieldError(addFieldErrors, 'phoneNumber') && 'border-red-300 bg-red-50/30',
                    )}
                    id={createStaffFieldIds.phoneNumber}
                    inputMode="tel"
                    name="phoneNumber"
                    onChange={(event) => updateAddFormField('phoneNumber', event.target.value)}
                    placeholder="09xx xxx xxx"
                    required
                    type="text"
                    value={addForm.phoneNumber}
                  />
                  <div
                    className="text-[10px] text-[#707882] mt-1"
                    id={getFieldDescriptionId('phoneNumber')}
                  >
                    10 số di động Việt Nam
                  </div>
                  {renderCreateStaffFieldError('phoneNumber')}
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={createStaffFieldIds.identityCardNumber}
                  >
                    Số CCCD (12 số) <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    aria-describedby={getFieldDescribedBy(addFieldErrors, 'identityCardNumber')}
                    aria-invalid={Boolean(getFirstFieldError(addFieldErrors, 'identityCardNumber'))}
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15',
                      getFirstFieldError(addFieldErrors, 'identityCardNumber') && 'border-red-300 bg-red-50/30',
                    )}
                    id={createStaffFieldIds.identityCardNumber}
                    inputMode="numeric"
                    maxLength={12}
                    name="identityCardNumber"
                    onChange={(event) => updateAddFormField('identityCardNumber', event.target.value)}
                    placeholder="012345678901"
                    required
                    type="text"
                    value={addForm.identityCardNumber}
                  />
                  {renderCreateStaffFieldError('identityCardNumber')}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 mb-3.5 sm:grid-cols-2">
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={createStaffFieldIds.dateOfBirth}
                  >
                    Ngày sinh <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    aria-describedby={getFieldDescribedBy(addFieldErrors, 'dateOfBirth')}
                    aria-invalid={Boolean(getFirstFieldError(addFieldErrors, 'dateOfBirth'))}
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15',
                      getFirstFieldError(addFieldErrors, 'dateOfBirth') && 'border-red-300 bg-red-50/30',
                    )}
                    id={createStaffFieldIds.dateOfBirth}
                    name="dateOfBirth"
                    onChange={(event) => updateAddFormField('dateOfBirth', event.target.value)}
                    required
                    type="date"
                    value={addForm.dateOfBirth}
                  />
                  {renderCreateStaffFieldError('dateOfBirth')}
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={createStaffFieldIds.gender}
                  >
                    Giới tính <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <select
                    aria-describedby={getFieldDescribedBy(addFieldErrors, 'gender')}
                    aria-invalid={Boolean(getFirstFieldError(addFieldErrors, 'gender'))}
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15 bg-white',
                      getFirstFieldError(addFieldErrors, 'gender') && 'border-red-300 bg-red-50/30',
                    )}
                    id={createStaffFieldIds.gender}
                    name="gender"
                    onChange={(event) => updateAddFormField('gender', event.target.value)}
                    required
                    value={addForm.gender}
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                  {renderCreateStaffFieldError('gender')}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 mb-3.5 sm:grid-cols-2">
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={createStaffFieldIds.roleCode}
                  >
                    Vai trò <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <select
                    aria-describedby={getFieldDescribedBy(addFieldErrors, 'roleCode')}
                    aria-invalid={Boolean(getFirstFieldError(addFieldErrors, 'roleCode'))}
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15 bg-white',
                      getFirstFieldError(addFieldErrors, 'roleCode') && 'border-red-300 bg-red-50/30',
                    )}
                    id={createStaffFieldIds.roleCode}
                    name="roleCode"
                    onChange={(event) => updateAddFormField('roleCode', event.target.value)}
                    required
                    value={addForm.roleCode}
                  >
                    <option value="">-- Chọn vai trò --</option>
                    {roleOptions.map((option) => (
                      <option key={option.code} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {renderCreateStaffFieldError('roleCode')}
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={createStaffFieldIds.departmentId}
                  >
                    Khoa / Phòng <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <select
                    aria-describedby={getFieldDescribedBy(addFieldErrors, 'departmentId')}
                    aria-invalid={Boolean(getFirstFieldError(addFieldErrors, 'departmentId'))}
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15 bg-white',
                      getFirstFieldError(addFieldErrors, 'departmentId') && 'border-red-300 bg-red-50/30',
                    )}
                    id={createStaffFieldIds.departmentId}
                    name="departmentId"
                    onChange={(event) => updateAddFormField('departmentId', event.target.value)}
                    required
                    value={addForm.departmentId}
                  >
                    <option value="">-- Chọn khoa/phòng --</option>
                    {departmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {renderCreateStaffFieldError('departmentId')}
                </div>
              </div>

              {addFormError ? (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {addFormError}
                </p>
              ) : null}

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  className="px-4 py-2 border border-[#bfc7d2] hover:bg-[#f0f4f8] text-[#3f4851] rounded-lg text-xs font-semibold transition"
                  disabled={createMutation.isPending}
                  onClick={closeAddModal}
                  type="button"
                >
                  Hủy
                </button>
                <button
                  className="min-w-[132px] px-4 py-2 bg-[#006096] hover:bg-[#004f7e] text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={createMutation.isPending}
                  type="submit"
                >
                  {createMutation.isPending ? 'Đang tạo...' : '✓ Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal: Cấp lại mật khẩu */}
      {temporaryPasswordDialog ? (
        <div className="ktv-modal-overlay">
          <div
            aria-describedby="temporary-password-dialog-description"
            aria-labelledby="temporary-password-dialog-title"
            aria-modal="true"
            className="ktv-modal max-w-[420px] text-center"
            role="dialog"
          >
            <button
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f0f4f8] hover:bg-[#e4e9ed] text-[#707882] flex items-center justify-center text-sm font-semibold transition"
              aria-label="Đóng hộp thoại mật khẩu tạm thời"
              onClick={closeTemporaryPasswordDialog}
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
            <div className="text-base font-bold text-[#171c1f] mb-1" id="temporary-password-dialog-title">
              {temporaryPasswordDialog.source === 'create'
                ? 'Mật khẩu tạm thời của tài khoản mới'
                : 'Mật khẩu tạm thời sau cấp lại'}
            </div>
            <div className="text-xs text-[#707882] mb-4" id="temporary-password-dialog-description">
              Nhân viên: {temporaryPasswordDialog.targetName}
            </div>

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
              <div className="ktv-pass-reveal-value">{temporaryPasswordDialog.temporaryPassword}</div>
              <div className="ktv-pass-reveal-note">
                Ghi chép mật khẩu này trước khi đóng hộp thoại.
                <br />
                Hệ thống không lưu trữ mật khẩu này sau khi đóng.
              </div>
            </div>

            <div className="mt-4 flex gap-2.5 justify-center">
              <button
                className="px-3.5 py-2 bg-[#e8f4ff] text-[#006096] border border-[#cee5ff] hover:bg-[#cee5ff] rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                onClick={() => void handleCopyTemporaryPassword()}
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
                onClick={closeTemporaryPasswordDialog}
                type="button"
              >
                ✓ Đã bàn giao — Đóng
              </button>
            </div>

            <div className="text-[11px] text-[#707882] mt-3">
              Hành động này đã được ghi nhận trong nhật ký kiểm toán.
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal: Edit User */}
      {editUser ? (
        <div className="ktv-modal-overlay">
          <div
            aria-describedby="edit-staff-dialog-description"
            aria-labelledby="edit-staff-dialog-title"
            aria-modal="true"
            className="ktv-modal max-h-[calc(100vh-40px)] max-w-[640px] overflow-y-auto"
            role="dialog"
          >
            <button
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f0f4f8] hover:bg-[#e4e9ed] text-[#707882] flex items-center justify-center text-sm font-semibold transition"
              aria-label="Đóng form chỉnh sửa tài khoản"
              disabled={updateMutation.isPending}
              onClick={() => {
                setEditFormError('');
                setEditFieldErrors({});
                setEditUser(null);
              }}
              type="button"
            >
              ✕
            </button>
            <div className="text-base font-bold text-[#171c1f] mb-1" id="edit-staff-dialog-title">
              Chỉnh sửa tài khoản nhân viên
            </div>
            <div className="text-xs text-[#707882] mb-5" id="edit-staff-dialog-description">
              Mã NV: <span className="font-mono font-bold text-[#006096]">{editUser.id}</span> — kiểm tra thông tin định danh trước khi lưu.
            </div>

            <form noValidate onSubmit={handleSaveEditUser}>
              <div className="grid grid-cols-1 gap-3.5 mb-3.5 sm:grid-cols-2">
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={editStaffFieldIds.fullName}
                  >
                    Họ và tên <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    aria-describedby={getEditFieldDescribedBy(editFieldErrors, 'fullName')}
                    aria-invalid={Boolean(getFirstEditFieldError(editFieldErrors, 'fullName'))}
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15',
                      getFirstEditFieldError(editFieldErrors, 'fullName') && 'border-red-300 bg-red-50/30',
                    )}
                    disabled={updateMutation.isPending}
                    id={editStaffFieldIds.fullName}
                    name="fullName"
                    onChange={(event) => updateEditUserField('fullName', event.target.value)}
                    required
                    type="text"
                    value={editUser.name}
                  />
                  {renderEditStaffFieldError('fullName')}
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={editStaffFieldIds.username}
                  >
                    Tên đăng nhập <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    aria-describedby={getEditFieldDescribedBy(editFieldErrors, 'username')}
                    aria-invalid={Boolean(getFirstEditFieldError(editFieldErrors, 'username'))}
                    autoComplete="username"
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15',
                      getFirstEditFieldError(editFieldErrors, 'username') && 'border-red-300 bg-red-50/30',
                    )}
                    disabled={updateMutation.isPending}
                    id={editStaffFieldIds.username}
                    name="username"
                    onChange={(event) => updateEditUserField('username', event.target.value)}
                    required
                    type="text"
                    value={editUser.username}
                  />
                  {renderEditStaffFieldError('username')}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 mb-3.5 sm:grid-cols-2">
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={editStaffFieldIds.phoneNumber}
                  >
                    Số điện thoại <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    aria-describedby={getEditFieldDescribedBy(editFieldErrors, 'phoneNumber')}
                    aria-invalid={Boolean(getFirstEditFieldError(editFieldErrors, 'phoneNumber'))}
                    autoComplete="tel"
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15',
                      getFirstEditFieldError(editFieldErrors, 'phoneNumber') && 'border-red-300 bg-red-50/30',
                    )}
                    disabled={updateMutation.isPending}
                    id={editStaffFieldIds.phoneNumber}
                    inputMode="tel"
                    name="phoneNumber"
                    onChange={(event) => updateEditUserField('phoneNumber', event.target.value)}
                    required
                    type="text"
                    value={editUser.phone}
                  />
                  {renderEditStaffFieldError('phoneNumber')}
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={editStaffFieldIds.identityCardNumber}
                  >
                    Số CCCD <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    aria-describedby={getEditFieldDescribedBy(editFieldErrors, 'identityCardNumber')}
                    aria-invalid={Boolean(getFirstEditFieldError(editFieldErrors, 'identityCardNumber'))}
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15',
                      getFirstEditFieldError(editFieldErrors, 'identityCardNumber') && 'border-red-300 bg-red-50/30',
                    )}
                    disabled={updateMutation.isPending}
                    id={editStaffFieldIds.identityCardNumber}
                    inputMode="numeric"
                    maxLength={12}
                    name="identityCardNumber"
                    onChange={(event) => updateEditUserField('identityCardNumber', event.target.value)}
                    required
                    type="text"
                    value={editUser.cccd ?? ''}
                  />
                  {renderEditStaffFieldError('identityCardNumber')}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 mb-3.5 sm:grid-cols-2">
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={editStaffFieldIds.dateOfBirth}
                  >
                    Ngày sinh <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    aria-describedby={getEditFieldDescribedBy(editFieldErrors, 'dateOfBirth')}
                    aria-invalid={Boolean(getFirstEditFieldError(editFieldErrors, 'dateOfBirth'))}
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15',
                      getFirstEditFieldError(editFieldErrors, 'dateOfBirth') && 'border-red-300 bg-red-50/30',
                    )}
                    disabled={updateMutation.isPending}
                    id={editStaffFieldIds.dateOfBirth}
                    name="dateOfBirth"
                    onChange={(event) => updateEditUserField('dateOfBirth', event.target.value)}
                    required
                    type="date"
                    value={editUser.dateOfBirth}
                  />
                  {renderEditStaffFieldError('dateOfBirth')}
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={editStaffFieldIds.gender}
                  >
                    Giới tính <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <select
                    aria-describedby={getEditFieldDescribedBy(editFieldErrors, 'gender')}
                    aria-invalid={Boolean(getFirstEditFieldError(editFieldErrors, 'gender'))}
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15 bg-white',
                      getFirstEditFieldError(editFieldErrors, 'gender') && 'border-red-300 bg-red-50/30',
                    )}
                    disabled={updateMutation.isPending}
                    id={editStaffFieldIds.gender}
                    name="gender"
                    onChange={(event) => updateEditUserField('gender', event.target.value)}
                    required
                    value={editUser.gender}
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                  {renderEditStaffFieldError('gender')}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 mb-3.5 sm:grid-cols-2">
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={editStaffFieldIds.roleCode}
                  >
                    Vai trò <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <select
                    aria-describedby={getEditFieldDescribedBy(editFieldErrors, 'roleCode')}
                    aria-invalid={Boolean(getFirstEditFieldError(editFieldErrors, 'roleCode'))}
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15 bg-white',
                      getFirstEditFieldError(editFieldErrors, 'roleCode') && 'border-red-300 bg-red-50/30',
                    )}
                    disabled={updateMutation.isPending}
                    id={editStaffFieldIds.roleCode}
                    name="roleCode"
                    onChange={(event) => updateEditUserField('roleCode', event.target.value)}
                    required
                    value={editUser.roleCode}
                  >
                    {roleOptions.map((option) => (
                      <option key={option.code} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {renderEditStaffFieldError('roleCode')}
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-[#3f4851] mb-1"
                    htmlFor={editStaffFieldIds.departmentId}
                  >
                    Khoa / Phòng <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <select
                    aria-describedby={getEditFieldDescribedBy(editFieldErrors, 'departmentId')}
                    aria-invalid={Boolean(getFirstEditFieldError(editFieldErrors, 'departmentId'))}
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15 bg-white',
                      getFirstEditFieldError(editFieldErrors, 'departmentId') && 'border-red-300 bg-red-50/30',
                    )}
                    disabled={updateMutation.isPending}
                    id={editStaffFieldIds.departmentId}
                    name="departmentId"
                    onChange={(event) => updateEditUserField('departmentId', event.target.value)}
                    required
                    value={editUser.deptCode ?? ''}
                  >
                    <option value="">-- Chọn khoa/phòng --</option>
                    {departmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {renderEditStaffFieldError('departmentId')}
                </div>
              </div>

              <div className="mb-5">
                <label
                  className="block text-xs font-semibold text-[#3f4851] mb-1"
                  htmlFor={editStaffFieldIds.isActive}
                >
                  Trạng thái tài khoản
                </label>
                <select
                  aria-describedby={getEditFieldDescribedBy(editFieldErrors, 'isActive')}
                  aria-invalid={Boolean(getFirstEditFieldError(editFieldErrors, 'isActive'))}
                  className={cn(
                    'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15 bg-white',
                    getFirstEditFieldError(editFieldErrors, 'isActive') && 'border-red-300 bg-red-50/30',
                  )}
                  disabled={updateMutation.isPending}
                  id={editStaffFieldIds.isActive}
                  name="isActive"
                  onChange={(event) => updateEditUserField('isActive', event.target.value === 'active')}
                  value={editUser.status === 'locked' ? 'locked' : 'active'}
                >
                  <option value="active">Hoạt động</option>
                  <option value="locked">Bị khóa</option>
                </select>
                {renderEditStaffFieldError('isActive')}
              </div>

              {editFormError ? (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {editFormError}
                </p>
              ) : null}

              <div className="flex gap-2.5 justify-end">
                <button
                  className="px-4 py-2 border border-[#bfc7d2] hover:bg-[#f0f4f8] text-[#3f4851] rounded-lg text-xs font-semibold transition"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    setEditFormError('');
                    setEditFieldErrors({});
                    setEditUser(null);
                  }}
                  type="button"
                >
                  Hủy
                </button>
                <button
                  className="min-w-[128px] px-4 py-2 bg-[#006096] hover:bg-[#004f7e] text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={updateMutation.isPending}
                  type="submit"
                >
                  {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
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

function ItTechnicianContent({
  activePage,
  principal,
}: {
  activePage: PageKind;
  principal: ItPrincipal;
}) {
  if (activePage === 'audit') return <AuditContent />;
  if (activePage === 'users') return <UsersContent principal={principal} />;
  if (activePage === 'rbac') return <RbacContent />;
  if (activePage === 'backup') return <BackupContent />;

  return <MonitoringContent />;
}

export function ItTechnicianWorkspace({ principal }: ItTechnicianWorkspaceProps) {
  const [activePage, setActivePage] = useState<PageKind>('monitoring');

  return (
    <ItShell activePage={activePage} onChangePage={setActivePage}>
      <ItTechnicianContent activePage={activePage} principal={principal} />
    </ItShell>
  );
}
