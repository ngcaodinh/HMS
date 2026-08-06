'use client';

import type { FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/shared/api-client';
import { LogoutButton } from '@/shared/auth/LogoutButton';
import { RoleIcon } from '@/shared/components/RoleIcon';
import { Sidebar as SharedSidebar } from '@/shared/components/sidebar/Sidebar';
import type { SidebarNavSectionConfig } from '@/shared/components/sidebar/sidebar.types';

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
import { canAssignRoleCode, getManageableRoleOptions } from '../../types/staff-role-options';
import type { DepartmentCode, RoleCode, StaffUser as ApiStaffUser } from '../../types/staff.schema';
import { buildStaffUsersCsv } from '../../api/staff-export';

/** Tab nội bộ của workspace; mặc định mở giám sát và không phản ánh route URL. */
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

/**
 * Principal tối thiểu do server page truyền xuống để UI lọc role và đánh dấu tài khoản hiện tại.
 */
type ItPrincipal = {
  id: string;
  roleCodes: string[];
};

type DepartmentOption = {
  label: string;
  value: DepartmentCode;
};

/** State ngắn hạn của dialog bàn giao credential; không dùng làm cache hoặc persistence. */
type TemporaryPasswordDialog = {
  source: 'create' | 'reset';
  targetName: string;
  temporaryPassword: string;
};

/** Tài khoản đang chờ operator xác nhận chuyển trạng thái kèm lý do audit. */
type StaffStatusAction = {
  isActive: boolean;
  user: StaffUserItem;
};

/** Props server/client boundary của workspace IT. */
type ItTechnicianWorkspaceProps = {
  principal: ItPrincipal;
};

/* Vùng điều hướng và catalog dữ liệu trình bày cho các tab vận hành IT. */
/** Cấu hình menu và dữ liệu trình bày tĩnh cho các tab vận hành của workspace IT. */
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
  {
    role: 'Điều dưỡng',
    tone: 'teal',
    values: [false, true, false, true, false, false, false, false],
  },
  {
    role: 'Dược sĩ',
    tone: 'amber',
    values: [false, false, true, false, false, false, false, false],
  },
  {
    role: 'KTV Xét nghiệm',
    tone: 'slate',
    values: [false, false, false, true, false, false, false, false],
  },
  { role: 'Lễ tân', tone: 'slate', values: [true, false, false, false, true, false, false, false] },
  {
    role: 'Kế toán',
    tone: 'slate',
    values: [false, false, false, false, true, false, false, false],
  },
  {
    role: 'Kỹ thuật IT',
    tone: 'sky',
    values: [false, false, false, false, false, false, true, true],
  },
] satisfies Array<{ role: string; tone: Tone; values: boolean[] }>;

/* Vùng primitive giao diện: class helper, icon, badge, popup và shell dùng chung. */
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getToneClasses(tone: Tone) {
  return {
    amber: {
      bar: 'bg-[#a05c00]',
      bg: 'bg-[#fff0d9]',
      border: 'border-[#a05c00]/25',
      text: 'text-[#8a4f00]',
    },
    green: {
      bar: 'bg-[#1a7a4a]',
      bg: 'bg-[#e1f5e9]',
      border: 'border-[#1a7a4a]/25',
      text: 'text-[#1a7a4a]',
    },
    red: {
      bar: 'bg-[#ba1a1a]',
      bg: 'bg-[#ffdad6]/70',
      border: 'border-[#ba1a1a]/25',
      text: 'text-[#ba1a1a]',
    },
    sky: {
      bar: 'bg-[#006096]',
      bg: 'bg-[#e8f4ff]',
      border: 'border-[#006096]/20',
      text: 'text-[#006096]',
    },
    slate: {
      bar: 'bg-[#707882]',
      bg: 'bg-[#eaeef2]',
      border: 'border-[#bfc7d2]',
      text: 'text-[#3f4851]',
    },
    teal: {
      bar: 'bg-[#006673]',
      bg: 'bg-[#e0f7fa]',
      border: 'border-[#006673]/25',
      text: 'text-[#006673]',
    },
  }[tone];
}

function getToneHex(tone: Tone) {
  return {
    amber: '#a05c00',
    green: '#1a7a4a',
    red: '#ba1a1a',
    sky: '#006096',
    slate: '#707882',
    teal: '#006673',
  }[tone];
}

function Icon({ className, name }: { className?: string; name: IconName }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      {name === 'activity' && (
        <path
          d="M4 13h4l2-6 4 10 2-4h4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      )}
      {name === 'alert' && (
        <path
          d="M12 4 3 20h18L12 4Zm0 5v5m0 3h.01"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      )}
      {name === 'bell' && (
        <path
          d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      )}
      {name === 'check' && (
        <path
          d="m5 12.5 4 4L19 7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
      )}
      {name === 'chevronLeft' && (
        <path
          d="m15 18-6-6 6-6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      )}
      {name === 'chevronRight' && (
        <path
          d="m9 18 6-6-6-6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      )}
      {name === 'database' && (
        <path
          d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === 'download' && (
        <path
          d="M12 4v10m0 0 4-4m-4 4-4-4M5 20h14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      )}
      {name === 'eye' && (
        <path
          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === 'fileText' && (
        <path
          d="M7 3h7l4 4v14H7V3Zm7 0v5h5M9 13h6M9 17h6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === 'hardDrive' && (
        <path
          d="M5 5h14l2 9v5H3v-5l2-9Zm-2 9h18M7 17h.01M11 17h.01"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === 'key' && (
        <path
          d="M14 7a5 5 0 1 0 1.2 5.2L21 6.4V4h-2.4l-1.4 1.4H15.2L14 7Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === 'lock' && (
        <path
          d="M7 10V8a5 5 0 0 1 10 0v2m-11 0h12v10H6V10Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === 'logOut' && (
        <path
          d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6.5A1.5 1.5 0 0 1 10 18.5V17M4 12h10m0 0-3-3m3 3-3 3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === 'plus' && (
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      )}
      {name === 'refresh' && (
        <path
          d="M20 12a8 8 0 0 1-13.7 5.7L4 15m0 0v5h5M4 12A8 8 0 0 1 17.7 6.3L20 9m0 0V4h-5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === 'search' && (
        <path
          d="m20 20-4.2-4.2M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === 'server' && (
        <path
          d="M5 3h14v7H5V3Zm0 11h14v7H5v-7Zm3-7h.01M8 18h.01"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === 'shield' && (
        <path
          d="M12 3 5 6v5c0 4.2 2.7 7.6 7 10 4.3-2.4 7-5.8 7-10V6l-7-3Zm-3 9 2 2 4-4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === 'users' && (
        <path
          d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 7c0-1.7-1-3.2-2.5-3.8M17 5.1a3 3 0 0 1 0 5.8M5 19c0-1.7 1-3.2 2.5-3.8M7 5.1a3 3 0 0 0 0 5.8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === 'wifi' && (
        <path
          d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01M2 9a14.5 14.5 0 0 1 20 0"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

function SearchBox({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="relative block w-full">
      <span className="sr-only">{label}</span>
      <Icon
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#707882]"
        name="search"
      />
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
      border: 'border-[#1a7a4a]/25',
      icon: 'bg-[#e1f5e9] text-[#1a7a4a]',
      text: 'text-[#1a7a4a]',
    };
  }

  return {
    border: 'border-[#ba1a1a]/25',
    icon: 'bg-[#ffdad6]/70 text-[#ba1a1a]',
    text: 'text-[#ba1a1a]',
  };
}

/**
 * Hiển thị popup thông báo thao tác quản trị, thay thế alert native của trình duyệt.
 *
 * @param notification Nội dung và tone `success`/`error` cần hiển thị.
 * @param onClose Callback do parent cung cấp để dọn notification state.
 * @remarks Component chỉ render success/error status; không gọi API, không retry và không tự thay
 * đổi server state. Parent sở hữu timer tự ẩn và xử lý lỗi nghiệp vụ.
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
      <div
        className={cn(
          'animate-[ktv-modal-in_0.25s_ease] rounded-xl border bg-white p-4 shadow-[0_12px_32px_rgba(0,96,150,0.16),0_2px_8px_rgba(0,0,0,0.06)]',
          toneClass.border,
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              toneClass.icon,
            )}
          >
            <Icon className="h-5 w-5" name={notification.tone === 'success' ? 'check' : 'alert'} />
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-bold leading-5', toneClass.text)}>
              {notification.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#3f4851]">{notification.message}</p>
          </div>
          <button
            aria-label="Đóng thông báo"
            className="rounded-md p-1 text-[#707882] transition hover:bg-[#f0f4f8] hover:text-[#171c1f] focus:outline-none focus:ring-2 focus:ring-[#006096]/20"
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

/**
 * Hiển thị điều hướng các vùng giám sát và quản trị trong workspace IT.
 *
 * @param activePage Tab đang chọn để đánh dấu trạng thái active.
 * @param onChangePage Callback cập nhật tab nội bộ; không điều hướng URL.
 * @remarks Menu có logout và nhãn tài khoản hiển thị; quyền mở route/API vẫn do server/backend
 * kiểm tra, không được suy diễn từ việc một item đang hiện trên UI.
 */
function ItSidebar({
  activePage,
  onChangePage,
}: {
  activePage: PageKind;
  onChangePage: (page: PageKind) => void;
}) {
  const sections: SidebarNavSectionConfig[] = navGroups.map((group) => ({
    id: group.label,
    label: group.label,
    items: group.items.map((item) => ({
      id: item.key,
      label: item.label,
      isActive: activePage === item.key,
      onClick: () => onChangePage(item.key),
      icon: <Icon className={styles.navIcon} name={item.icon} />,
      badge: item.badge ? (
        <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {item.badge}
        </span>
      ) : undefined,
    })),
  }));

  return (
    <SharedSidebar
      footer={
        <div className="flex w-full flex-col">
          <div className="flex items-center justify-between text-[10px] text-white/45">
            <span>Hệ thống trực</span>
            <span className="font-mono text-xs font-semibold text-white/90">09:51:54</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#55d7ed] to-[#006096] text-sm font-bold text-white shadow-[0_0_0_2px_rgba(255,255,255,0.08)] transition-transform duration-200 hover:scale-105">
              <RoleIcon role="it_tech" />
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
      }
      navAriaLabel="Thanh điều hướng quản trị hệ thống"
      sections={sections}
    />
  );
}

/** Hiển thị tiêu đề tab, trạng thái LIVE của monitoring và callback làm mới dữ liệu staff. */
function ItTopbar({ activePage, onRefresh }: { activePage: PageKind; onRefresh?: () => void }) {
  return (
    <header className={styles.topbar}>
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-sm font-semibold text-[#006096]">HMS-VN</span>
        <span className="text-sm font-light text-[#bfc7d2]">/</span>
        <h1 className="truncate text-sm font-semibold text-[#3f4851]">{pageTitles[activePage]}</h1>
        {activePage === 'monitoring' ? <ToneBadge tone="green">LIVE</ToneBadge> : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button aria-label="Thông báo hệ thống" className={styles.iconButton} type="button">
          <Icon className="h-5 w-5" name="bell" />
        </button>
        <button className={styles.secondaryButton} onClick={onRefresh} type="button">
          <Icon className="h-4 w-4" name="refresh" />
          Làm mới dữ liệu
        </button>
      </div>
    </header>
  );
}

/** Bọc sidebar, topbar, vùng cuộn nội dung và footer dùng chung cho mọi tab IT. */
function ItShell({
  activePage,
  children,
  onChangePage,
  onRefresh,
}: {
  activePage: PageKind;
  children: ReactNode;
  onChangePage: (page: PageKind) => void;
  onRefresh?: () => void;
}) {
  return (
    <main className={styles.shell}>
      <ItSidebar activePage={activePage} onChangePage={onChangePage} />
      <section className={styles.workspace}>
        <ItTopbar activePage={activePage} onRefresh={onRefresh} />
        <div className={styles.content}>{children}</div>
        <footer className={styles.footer}>© 2026 HMS-VN Solution. All rights reserved.</footer>
      </section>
    </main>
  );
}

/**
 * Hiển thị tiêu đề vùng nội dung và nhóm action tùy chọn của một tab.
 *
 * @param title Tiêu đề nghiệp vụ bắt buộc.
 * @param subtitle Mô tả trạng thái/phạm vi dữ liệu của tab.
 * @param eyebrow Nhãn phụ tùy chọn phía trên tiêu đề.
 * @param actions Nút hoặc control do tab sở hữu; component không tự xử lý callback.
 */
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
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.8px] text-[#006096]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-xl font-bold leading-7 text-[#171c1f] md:text-2xl">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-5 text-[#707882]">{subtitle}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}

/** Hiển thị một KPI tóm tắt với tone màu đã được catalog hóa. */
function SummaryCardView({ card }: { card: SummaryCard }) {
  const tone = getToneClasses(card.tone);

  return (
    <article
      className={cn(
        styles.card,
        'relative overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-0.5',
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-1', tone.bar)} />
      <p className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#707882]">
        {card.label}
      </p>
      <p className={cn('mt-3 text-3xl font-bold leading-9', tone.text)}>{card.value}</p>
      <p className={cn('mt-1 flex items-center gap-1 text-[10px] font-semibold', tone.text)}>
        <span className={cn('h-1.5 w-1.5 rounded-full', tone.bar)} />
        {card.helper}
      </p>
    </article>
  );
}

/** Hiển thị trạng thái online/offline của một dịch vụ cùng metric vận hành. */
function ServiceTile({ service }: { service: ServiceStatus }) {
  const tone = service.isOnline ? getToneClasses('green') : getToneClasses('red');

  return (
    <article
      className={cn(
        'rounded-lg border-2 bg-white p-4 transition-transform duration-200 hover:-translate-y-0.5',
        service.isOnline ? 'border-[#1a7a4a]/20' : 'border-[#ba1a1a]/25',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-bold text-[#171c1f]">{service.name}</h4>
        <Icon className="h-5 w-5 text-[#707882]" name={service.icon} />
      </div>
      <p className="mt-3 rounded bg-[#f0f4f8] px-2 py-1 font-mono text-[10px] text-[#3f4851]">
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

/** Hiển thị phần trăm sử dụng tài nguyên; `value` là phần trăm từ 0 đến 100. */
function ResourceRing({ metric }: { metric: ResourceMetric }) {
  const tone = getToneClasses(metric.tone);
  const ringColor = getToneHex(metric.tone);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="grid h-28 w-28 place-items-center rounded-full transition-[background] duration-500"
        style={
          {
            background: `conic-gradient(${ringColor} ${metric.value * 3.6}deg, #dfe3e7 0deg)`,
          } as React.CSSProperties
        }
      >
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center">
          <div>
            <p className={cn('text-xl font-bold', tone.text)}>{metric.value}%</p>
            <p className="text-[9px] font-bold uppercase text-[#707882]">{metric.label}</p>
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-[#171c1f]">{metric.label} Usage</p>
        <p className="text-[10px] text-[#707882]">{metric.detail}</p>
      </div>
    </div>
  );
}

/** Hiển thị một metric hoạt động tổng hợp và thanh phần trăm tương ứng. */
function ActivityRow({ item }: { item: ActivityMetric }) {
  const tone = getToneClasses(item.tone);

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-[#3f4851]">{item.label}</span>
        <span className={cn('font-bold', tone.text)}>{item.value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eaeef2]">
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 ease-out', tone.bar)}
          style={{ width: `${item.percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Hiển thị tab giám sát hạ tầng với các số liệu dịch vụ, tài nguyên, hoạt động và error log mẫu.
 *
 * @remarks Nội dung hiện tại là read-only presentation state trong client; các nút trình bày chưa
 * tạo mutation. Trạng thái loading/error/empty của API staff không áp dụng cho tab này.
 */
function MonitoringContent() {
  return (
    <div className="min-w-[1080px] space-y-6 p-7">
      <PageHeader
        actions={
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
        }
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
          <span className="h-4 w-1 rounded-full bg-[#006096]" />
          <h3 className={styles.sectionTitle}>Trạng thái các dịch vụ cốt lõi</h3>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {serviceStatuses.map((service) => (
            <ServiceTile key={service.name} service={service} />
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <button className={styles.secondaryButton} type="button">
            Restart DB Pool
          </button>
          <button className={styles.secondaryButton} type="button">
            Restart Socket.io
          </button>
        </div>
      </section>

      <section className="grid grid-cols-[1.1fr_0.9fr] gap-6">
        <div className={cn(styles.card, 'p-6')}>
          <div className="mb-8 flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-[#006096]" />
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
            <span className="h-4 w-1 rounded-full bg-[#006096]" />
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
        <div className="flex items-center justify-between border-b border-[#dfe3e7] px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-[#006096]" />
            <h3 className={styles.sectionTitle}>Nhật ký lỗi hệ thống gần nhất</h3>
          </div>
          <button
            className="text-[10px] font-bold text-[#006096] transition hover:text-[#004f7e]"
            type="button"
          >
            Xem tất cả nhật ký
          </button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-[#f0f4f8] text-[10px] font-bold uppercase tracking-[0.5px] text-[#707882]">
            <tr>
              {['Thời điểm', 'Phân hệ', 'Mã lỗi', 'Thông điệp lỗi', 'Lặp lại', 'Mức độ'].map(
                (head) => (
                  <th className="px-6 py-4" key={head}>
                    {head}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dfe3e7]">
            {errorLogs.map((log) => (
              <tr className="transition-colors hover:bg-[#f6fafe]" key={`${log.time}-${log.code}`}>
                <td className="px-6 py-5 font-mono text-xs">{log.time}</td>
                <td className="px-6 py-5">
                  <ToneBadge tone="sky">{log.module}</ToneBadge>
                </td>
                <td className="px-6 py-5 font-mono text-xs font-bold">{log.code}</td>
                <td className="px-6 py-5 text-xs leading-5">{log.message}</td>
                <td className="px-6 py-5">
                  <ToneBadge tone={log.tone}>{log.count}</ToneBadge>
                </td>
                <td className="px-6 py-5">
                  <ToneBadge tone={log.tone}>{log.severity}</ToneBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between bg-[#f0f4f8] px-6 py-4">
          <p className="text-[10px] text-[#707882]">
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

/**
 * Hiển thị nhật ký kiểm toán ở chế độ chỉ đọc với tìm kiếm, bộ lọc và phân trang trình bày.
 *
 * @remarks Dữ liệu nhạy cảm trong audit phải được backend kiểm soát và masking theo permission;
 * component này không sửa/xóa log, không gọi API và không thay thế audit authorization.
 */
function AuditContent() {
  return (
    <div className="min-w-[1080px] space-y-6 p-8">
      <PageHeader
        actions={
          <button className={styles.secondaryButton} type="button">
            <Icon className="h-4 w-4" name="download" />
            Xuất báo cáo bảo mật
          </button>
        }
        subtitle="Chế độ chỉ đọc - Dữ liệu log không thể sửa hoặc xóa - Theo Nghị định 13/2023/NĐ-CP"
        title="Nhật ký Kiểm toán Hệ thống - Audit Logs"
      />

      <section className={cn(styles.card, 'grid grid-cols-[minmax(0,1fr)_190px_170px] gap-4 p-4')}>
        <SearchBox label="Tìm nhật ký kiểm toán" placeholder="Tìm tài khoản, IP, mã lỗi..." />
        <button className={styles.secondaryButton} type="button">
          Tất cả hành động
        </button>
        <button className={styles.secondaryButton} type="button">
          Tất cả phân hệ
        </button>
        <div className="col-span-3 flex items-center gap-3">
          <input aria-label="Từ ngày" className={styles.searchInput} defaultValue="07/18/2026" />
          <span className="text-[#707882]">-</span>
          <input aria-label="Đến ngày" className={styles.searchInput} defaultValue="07/18/2026" />
        </div>
      </section>

      <section className={cn(styles.card, 'overflow-hidden')}>
        <div className="flex items-center gap-3 border-b border-[#eaeef2] px-6 py-4">
          <ToneBadge tone="amber">3 hành động đặc biệt hôm nay</ToneBadge>
          <ToneBadge tone="slate">Tổng: 1.842 bản ghi</ToneBadge>
        </div>
        <table className="w-full text-left">
          <thead className="bg-[#f0f4f8] text-[11px] font-bold uppercase tracking-[0.5px] text-[#3f4851]">
            <tr>
              {[
                'Thời gian',
                'Tài khoản',
                'Địa chỉ IP',
                'Hành động',
                'Mô tả thay đổi',
                'Chi tiết',
              ].map((head) => (
                <th className="px-6 py-4" key={head}>
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeef2]">
            {auditLogs.map((log) => (
              <tr
                className="transition-colors hover:bg-[#f6fafe]"
                key={`${log.time}-${log.action}`}
              >
                <td className="px-6 py-4 font-mono text-xs leading-5">{log.time}</td>
                <td className="px-6 py-4">
                  <p className="font-bold">{log.account}</p>
                  <p className="font-mono text-[11px] text-[#707882]">{log.employeeId}</p>
                </td>
                <td className="px-6 py-4 font-mono text-xs">{log.ip}</td>
                <td className="px-6 py-4">
                  <p className="font-mono text-xs font-bold">{log.action}</p>
                  <p className="mt-1 text-[10px] text-[#707882]">{log.module}</p>
                </td>
                <td className="max-w-[360px] px-6 py-4 text-xs leading-5">{log.description}</td>
                <td className="px-6 py-4">
                  <button
                    aria-label={`Xem chi tiết ${log.action}`}
                    className={styles.iconButton}
                    type="button"
                  >
                    <Icon className="h-4 w-4" name="eye" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-[#eaeef2] bg-[#f0f4f8] px-6 py-4">
          <p className="text-xs font-bold text-[#3f4851]">
            Dữ liệu log được bảo vệ ở cấp Database - không thể UPDATE hoặc DELETE
          </p>
          <div className="flex items-center gap-2">
            <button className={styles.secondaryButton} type="button">
              <Icon className="h-4 w-4" name="chevronLeft" />
              Trước
            </button>
            <button className={styles.primaryButton} type="button">
              1
            </button>
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

/**
 * Hiển thị ma trận role-permission và cảnh báo các quyền nhạy cảm đang bị khóa.
 *
 * @remarks Đây là presentation của RBAC; nút cấu hình chưa gắn mutation trong component này.
 * Authorization thực tế và audit thay đổi quyền thuộc backend.
 */
function RbacContent() {
  return (
    <div className="min-w-[1080px] space-y-6 p-8">
      <PageHeader
        actions={
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
        }
        eyebrow="Phân quyền hệ thống"
        subtitle="Cấu hình chi tiết quyền thao tác theo vai trò nhân viên - Mọi thay đổi đều được ghi nhật ký kiểm toán"
        title="Ma trận phân quyền vai trò (RBAC)"
      />

      <div className="rounded-lg border border-[#a05c00]/25 bg-[#fff0d9] px-4 py-3 text-sm leading-5 text-[#7a4f00]">
        Quyền của vai trò admin và director đối với một số danh mục kiểm toán nhạy cảm đang được
        khóa chỉnh sửa để bảo vệ tính toàn vẹn hệ thống.
      </div>

      <section className={cn(styles.card, 'overflow-hidden')}>
        <table className="w-full table-fixed text-left">
          <thead className="bg-[#f0f4f8] text-[11px] font-bold uppercase tracking-[0.4px] text-[#3f4851]">
            <tr>
              <th className="w-40 px-4 py-5">Vai trò \ Quyền</th>
              {permissionColumns.map((column) => (
                <th className="px-3 py-5 text-center" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dfe3e7]">
            {permissionRows.map((row) => (
              <tr className="transition-colors hover:bg-[#f6fafe]" key={row.role}>
                <td className="px-4 py-4">
                  <ToneBadge tone={row.tone}>{row.role}</ToneBadge>
                </td>
                {row.values.map((isAllowed, index) => (
                  <td
                    className="px-3 py-4 text-center"
                    key={`${row.role}-${permissionColumns[index]}`}
                  >
                    <span
                      aria-label={isAllowed ? 'Được cấp quyền' : 'Chưa cấp quyền'}
                      className={cn(
                        'inline-grid h-5 w-5 place-items-center rounded border transition-colors',
                        isAllowed
                          ? 'border-[#006096] bg-[#006096] text-white'
                          : 'border-[#707882]/50 bg-white',
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

/** Model trình bày của một row staff, tách khỏi response schema của API. */
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

/* Vùng contract và helper của quản trị tài khoản staff. */
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

/** Danh mục khoa/phòng dùng để map code API sang nhãn và chọn trong form IT. */
const departmentOptions: DepartmentOption[] = [
  { label: 'Khoa Da liễu', value: 'dermatology' },
  { label: 'Khoa Lâm sàng', value: 'clinical' },
  { label: 'Khoa Xét nghiệm', value: 'laboratory' },
  { label: 'Phòng Dược', value: 'pharmacy' },
  { label: 'Phòng Kế toán', value: 'accounting' },
  { label: 'Quầy Tiếp tân', value: 'reception' },
  { label: 'Phòng IT', value: 'it' },
];

const departmentLabelById = Object.fromEntries(
  departmentOptions.map((option) => [option.value, option.label]),
);

/** Giá trị rỗng ban đầu và giá trị reset của form tạo staff. */
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

/** Số tài khoản mỗi trang gửi lên API; phân trang server bắt đầu từ trang 1. */
const staffUsersPageSize = 20;

/** Tạo download CSV cục bộ từ nội dung đã build, không gửi dữ liệu trở lại server. */
const downloadStaffUsersCsv = (csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `hms-staff-users-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
};

/**
 * Giữ focus trong dialog khi Tab/Shift+Tab đi tới biên danh sách control.
 *
 * @param event Keyboard event trên dialog; chỉ chặn phím `Tab`.
 * @remarks Handler ngăn focus thoát qua overlay để hỗ trợ keyboard accessibility; không validate,
 * mutation hoặc navigation.
 */
const handleModalKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
  if (event.key !== 'Tab') return;

  const focusableElements = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (!firstElement || !lastElement) return;

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
};

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
 * Định dạng thời điểm đăng nhập cuối cho bảng nhân viên.
 *
 * @param value ISO datetime từ API hoặc `null` khi tài khoản chưa đăng nhập.
 * @returns Chuỗi locale `vi-VN`, hoặc fallback `Chưa đăng nhập`.
 * @remarks Không dùng giá trị này làm khóa hoặc payload; đây chỉ là format trình bày theo timezone
 * của browser.
 */
const formatLastLogin = (value: string | null) =>
  value ? new Date(value).toLocaleString('vi-VN') : 'Chưa đăng nhập';

/**
 * Chuẩn hóa ngày sinh từ ISO/backend DATE về dạng `yyyy-MM-dd` cho input date.
 *
 * @param value Chuỗi ngày hoặc datetime có phần ngày ở 10 ký tự đầu.
 * @returns Phần ngày theo format HTML date; không tự đổi timezone.
 */
const formatDateInputValue = (value: string) => value.slice(0, 10);

const getFirstFieldError = (fieldErrors: CreateStaffFormFieldErrors, field: CreateStaffFormField) =>
  fieldErrors[field]?.[0];

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
  ]
    .filter(Boolean)
    .join(' ') || undefined;

const getEditFieldErrorId = (field: EditStaffFormField) => `${editStaffFieldIds[field]}-error`;

const getFirstEditFieldError = (fieldErrors: EditStaffFormFieldErrors, field: EditStaffFormField) =>
  fieldErrors[field]?.[0];

const getEditFieldDescribedBy = (
  fieldErrors: EditStaffFormFieldErrors,
  field: EditStaffFormField,
) => (getFirstEditFieldError(fieldErrors, field) ? getEditFieldErrorId(field) : undefined);

/**
 * Map StaffUser từ API sang model trình bày của workspace IT.
 *
 * @param user Payload đã parse bằng Zod từ API, không chứa password.
 * @param currentUserId Principal hiện tại để đánh dấu row không được tự khóa.
 * @returns Item phục vụ render/filter/edit, giữ `updatedAt` cho optimistic lock.
 * @remarks Mapping chỉ đổi format/label ở client; backend vẫn là nguồn sự thật cho role, status và
 * permission. Fallback label chỉ phục vụ hiển thị khi catalog chưa có code tương ứng.
 */
const mapApiStaffUserToItem = (user: ApiStaffUser, currentUserId: string): StaffUserItem => {
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
    status: user.id === currentUserId ? 'current' : user.isActive ? 'active' : 'locked',
    updatedAt: user.updatedAt,
    username: user.username,
  };
};

/* Vùng state, effect, mutation và form/dialog của staff administration. */
/**
 * Điều phối vùng quản lý tài khoản nhân viên cho IT/admin.
 *
 * @param principal Principal đã xác thực từ server page, dùng cho phạm vi role và nhận diện tài
 * khoản hiện tại.
 * @remarks Server state đến từ các query `GET /api/staff-users` và hai query đếm active/locked.
 * Component sở hữu filter, debounce, pagination, form state, dialog, notification và các mutation
 * create/update/reset. Có loading/error/empty state cho bảng; success/error của mutation hiển thị
 * trong dialog hoặc popup. Credential tạm thời chỉ tồn tại trong state cho tới khi dialog đóng.
 * UI role gate không thay thế permission và audit backend.
 */
function UsersContent({ principal }: { principal: ItPrincipal }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentCode | ''>('');
  const [roleFilter, setRoleFilter] = useState<RoleCode | ''>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked'>('all');
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
  const [statusAction, setStatusAction] = useState<StaffStatusAction | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [resetTarget, setResetTarget] = useState<StaffUserItem | null>(null);
  const [resetReason, setResetReason] = useState('');
  const [notification, setNotification] = useState<PopupNotification | null>(null);
  const addAccountButtonRef = useRef<HTMLButtonElement>(null);
  const firstAddFieldRef = useRef<HTMLInputElement>(null);
  const temporaryPasswordCloseButtonRef = useRef<HTMLButtonElement>(null);
  const notificationTimer = useRef<number | null>(null);
  const copyTimer = useRef<number | null>(null);
  const queryClient = useQueryClient();

  /**
   * Debounce từ khóa trước khi đổi query key.
   *
   * @remarks Khi `searchQuery` đổi, effect đồng bộ timer của browser thay vì gọi API cho từng phím.
   * Cleanup hủy timer cũ để không phát hành stale query khi người dùng tiếp tục nhập.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 350);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const staffQuery = useStaffUsers({
    departmentId: departmentFilter || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    page: currentPage,
    pageSize: staffUsersPageSize,
    q: debouncedSearchQuery,
    roleCode: roleFilter || undefined,
  });
  const activeStaffCountQuery = useStaffUsers({
    departmentId: departmentFilter || undefined,
    isActive: true,
    page: 1,
    pageSize: 1,
    q: debouncedSearchQuery,
    roleCode: roleFilter || undefined,
  });
  const lockedStaffCountQuery = useStaffUsers({
    departmentId: departmentFilter || undefined,
    isActive: false,
    page: 1,
    pageSize: 1,
    q: debouncedSearchQuery,
    roleCode: roleFilter || undefined,
  });
  const createMutation = useCreateStaffUser();
  const updateMutation = useUpdateStaffUser();
  const resetMutation = useResetStaffPassword();
  const rawUsers = staffQuery.data?.items ?? [];
  const users = rawUsers.map((user) => mapApiStaffUserToItem(user, principal.id));
  const totalStaffUsers = staffQuery.data?.totalItems ?? users.length;
  const totalStaffPages = staffQuery.data?.totalPages ?? 1;
  const startPage = Math.min(Math.max(currentPage - 2, 1), Math.max(totalStaffPages - 4, 1));
  const pageNumbers = Array.from(
    { length: Math.min(totalStaffPages, 5) },
    (_, index) => startPage + index,
  );
  const activeCount = activeStaffCountQuery.data?.totalItems ?? 0;
  const lockedCount = lockedStaffCountQuery.data?.totalItems ?? 0;
  const hasStaffFilters = Boolean(
    debouncedSearchQuery || departmentFilter || roleFilter || statusFilter !== 'all',
  );
  const statsScopeLabel = hasStaffFilters ? 'Trong kết quả đang lọc' : 'Toàn hệ thống';
  const createRoleOptions = getManageableRoleOptions(principal, { mode: 'create' });
  const editRoleOptions = getManageableRoleOptions(principal);

  /**
   * Hiển thị popup thành công/lỗi và thay thế timer đang chờ.
   *
   * @param nextNotification Nội dung cần render; không chứa credential hoặc dữ liệu bệnh nhân.
   * @remarks Đây là side effect UI cục bộ: xóa timer cũ, đặt notification state rồi tự dọn sau
   * 3,6 giây; không gọi API và không thay đổi server state.
   */
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

  /**
   * Dọn các timer popup/copy khi component unmount.
   *
   * @remarks Effect không có dependency; cleanup ngắt timer của browser để callback không cập nhật
   * state sau khi vùng quản lý staff đã rời khỏi workspace.
   */
  useEffect(
    () => () => {
      if (notificationTimer.current) {
        window.clearTimeout(notificationTimer.current);
      }

      if (copyTimer.current) {
        window.clearTimeout(copyTimer.current);
      }
    },
    [],
  );

  /**
   * Đóng dialog bàn giao credential và xóa secret tạm khỏi React state.
   *
   * @remarks Callback từ nút đóng, overlay hoặc thao tác Escape; hủy timer sao chép và dọn UI,
   * không gửi request mới.
   */
  const closeTemporaryPasswordDialog = () => {
    if (copyTimer.current) {
      window.clearTimeout(copyTimer.current);
      copyTimer.current = null;
    }

    setTemporaryPasswordDialog(null);
    setCopiedPass(false);
  };

  /** Xóa toàn bộ giá trị và lỗi của form tạo để lần mở sau bắt đầu từ trạng thái rỗng. */
  const resetAddFormState = () => {
    setAddForm(defaultCreateStaffForm);
    setAddFieldErrors({});
    setAddFormError('');
  };

  /** Mở dialog tạo tài khoản sau khi reset form và lỗi cũ. */
  const openAddModal = () => {
    resetAddFormState();
    setIsAddModalOpen(true);
  };

  /** Đóng dialog tạo khi không pending và trả focus về nút đã mở dialog. */
  const closeAddModal = () => {
    if (createMutation.isPending) return;

    setIsAddModalOpen(false);
    resetAddFormState();
    addAccountButtonRef.current?.focus();
  };

  /**
   * Cập nhật một field từ sự kiện nhập/chọn và xóa lỗi cũ của chính field đó.
   *
   * @param field Tên field thuộc allowlist của form tạo.
   * @param value Giá trị text hiện tại từ control; validation đầy đủ chạy khi submit.
   * @remarks Handler chỉ cập nhật local form state, không gửi request và không tự suy diễn role,
   * khoa/phòng hoặc quyền backend.
   */
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

  /** Render lỗi field đầu tiên để input có inline error và liên kết accessibility. */
  const renderCreateStaffFieldError = (field: CreateStaffFormField) => {
    const error = getFirstFieldError(addFieldErrors, field);

    return error ? (
      <p className="mt-1 text-[10px] font-semibold text-[#ba1a1a]" id={getFieldErrorId(field)}>
        {error}
      </p>
    ) : null;
  };

  /**
   * Sao chép credential tạm thời qua Clipboard API khi operator bấm nút.
   *
   * @remarks Guard khi dialog đã đóng; success đánh dấu copied trong 3 giây và lỗi browser
   * permission hiển thị popup hướng dẫn thao tác thủ công. Không gửi hoặc lưu credential ra API.
   */
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

  /**
   * Đưa focus vào field đầu tiên khi dialog tạo tài khoản vừa mở.
   *
   * @remarks Dependency `isAddModalOpen` đồng bộ DOM focus với trạng thái overlay; không gọi API.
   * Không cần cleanup vì ref chỉ trỏ tới node hiện tại và effect không tạo subscription/timer.
   */
  useEffect(() => {
    if (!isAddModalOpen) return;

    firstAddFieldRef.current?.focus();
  }, [isAddModalOpen]);

  /**
   * Đưa focus về nút đóng khi dialog credential tạm thời xuất hiện.
   *
   * @remarks Dependency `temporaryPasswordDialog` bảo đảm keyboard user không bị rơi ra ngoài
   * overlay. Effect chỉ đồng bộ focus với DOM, không ghi credential ra external system.
   */
  useEffect(() => {
    if (!temporaryPasswordDialog) return;

    temporaryPasswordCloseButtonRef.current?.focus();
  }, [temporaryPasswordDialog]);

  /**
   * Lắng nghe Escape trên `window` để đóng dialog đang mở theo thứ tự ưu tiên.
   *
   * @remarks Effect phụ thuộc vào trạng thái dialog và mutation pending để guard việc đóng khi đang
   * submit. Cleanup remove listener mỗi lần dependency đổi hoặc component unmount, tránh listener
   * cũ đọc state stale và đóng nhầm dialog.
   */
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
    resetMutation.isPending,
    resetTarget,
    statusAction,
    temporaryPasswordDialog,
    updateMutation.isPending,
  ]);

  /**
   * Mở dialog xác nhận khóa/mở khóa cho row được click.
   *
   * @param user Row staff phải có `apiId` và `updatedAt` mới được thao tác; tài khoản hiện tại bị
   * guard để không tự khóa.
   * @remarks Handler chưa gọi mutation. Sau khi operator nhập reason, dialog gọi PATCH với
   * optimistic lock; backend mới quyết định permission, audit và kết quả cuối cùng.
   */
  const handleToggleLock = (user: StaffUserItem) => {
    if (!user.apiId || !user.updatedAt || user.status === 'current') return;

    setStatusReason('');
    setStatusAction({
      isActive: user.status === 'locked',
      user,
    });
  };

  /**
   * Submit thao tác khóa/mở khóa sau khi operator xác nhận và nhập reason hợp lệ.
   *
   * @remarks Trim reason và chặn dưới 10 ký tự trước khi gọi PATCH `staff.update`; success đóng
   * dialog và báo popup. Conflict `STAFF_MODIFIED_SINCE_READ` invalidates danh sách để tránh ghi
   * đè dữ liệu cũ; lỗi khác đi qua guard trạng thái mutation hiện tại trước khi tới nhánh popup
   * fallback.
   */
  const executeStatusAction = async () => {
    if (!statusAction?.user.apiId || !statusAction.user.updatedAt) return;

    const reason = statusReason.trim();
    if (reason.length < 10) {
      showNotification({
        message: 'Lý do phải có ít nhất 10 ký tự.',
        title: 'Chưa thể cập nhật trạng thái',
        tone: 'error',
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        ifUnmodifiedSince: statusAction.user.updatedAt,
        input: {
          isActive: statusAction.isActive,
          reason,
        },
        userId: statusAction.user.apiId,
      });
      setStatusAction(null);
      setStatusReason('');
      showNotification({
        message: statusAction.isActive ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.',
        title: 'Cập nhật trạng thái thành công',
        tone: 'success',
      });
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'STAFF_MODIFIED_SINCE_READ') {
        await queryClient.invalidateQueries({ queryKey: ['staff-users'] });
        setStatusAction(null);
        setStatusReason('');
        showNotification({
          message: 'Dữ liệu đã thay đổi. Danh sách đã được tải lại, vui lòng mở lại thao tác.',
          title: 'Dữ liệu đã cũ',
          tone: 'error',
        });
        return;
      }

      if (statusAction && !updateMutation.isPending) {
        setStatusAction(null);
        setStatusReason('');
        return;
      }

      if (resetTarget && !resetMutation.isPending) {
        setResetTarget(null);
        setResetReason('');
        return;
      }

      showNotification({
        message:
          caught instanceof Error ? caught.message : 'Không thể cập nhật trạng thái tài khoản',
        title: 'Thao tác chưa thành công',
        tone: 'error',
      });
    }
  };

  /**
   * Submit yêu cầu reset mật khẩu sau khi operator nhập reason hợp lệ.
   *
   * @remarks Handler gọi POST `staff.password.reset`, ghi audit ở backend và chỉ đưa credential
   * tạm thời vào dialog sau success. Lỗi validation/permission/network hiển thị qua popup; đóng
   * dialog reset và xóa reason sau khi request kết thúc.
   */
  const executeResetPassword = async () => {
    if (!resetTarget?.apiId) return;

    const reason = resetReason.trim();
    if (reason.length < 10) {
      showNotification({
        message: 'Lý do phải có ít nhất 10 ký tự.',
        title: 'Chưa thể cấp lại mật khẩu',
        tone: 'error',
      });
      return;
    }

    try {
      const result = await resetMutation.mutateAsync({
        reason,
        userId: resetTarget.apiId,
      });
      setResetTarget(null);
      setResetReason('');
      setTemporaryPasswordDialog({
        source: 'reset',
        targetName: result.user.fullName,
        temporaryPassword: result.temporaryPassword,
      });
    } catch (caught) {
      setResetTarget(null);
      setResetReason('');
      showNotification({
        message: caught instanceof Error ? caught.message : 'Không thể cấp lại mật khẩu',
        title: 'Cấp lại mật khẩu thất bại',
        tone: 'error',
      });
    }
  };

  /**
   * Cập nhật local state form edit theo field được phép sửa và xóa lỗi cũ của field đó.
   *
   * @param field Field từ allowlist form edit.
   * @param value Giá trị text/boolean hiện tại của control.
   * @remarks Handler không gọi API; validation và map payload chỉ chạy ở submit. Trạng thái
   * active/locked trên form phản ánh row đang edit, còn permission cuối cùng thuộc backend.
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

  /** Hiển thị lỗi validation đầu tiên cạnh input tương ứng trong modal chỉnh sửa tài khoản. */
  const renderEditStaffFieldError = (field: EditStaffFormField) => {
    const error = getFirstEditFieldError(editFieldErrors, field);

    return error ? (
      <p className="mt-1 text-[10px] font-semibold text-[#ba1a1a]" id={getEditFieldErrorId(field)}>
        {error}
      </p>
    ) : null;
  };

  /**
   * Xử lý submit form tạo tài khoản và mở dialog bàn giao credential tạm thời.
   *
   * @param event Submit event của form; luôn prevent default navigation của browser.
   * @remarks Guard pending, parse Zod và kiểm tra role UI trước khi gọi `POST /api/staff-users`.
   * Field validation/API error được giữ cạnh input, lỗi hệ thống ở form error; success đóng form,
   * refresh cache qua mutation và giữ credential chỉ trong dialog một lần.
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

    if (!canAssignRoleCode(createRoleOptions, parsedForm.data.roleCode)) {
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

      setAddFormError(
        caught instanceof Error ? caught.message : 'Không thể tạo tài khoản nhân viên',
      );
      return;
    }
  };

  /**
   * Xử lý submit form edit với optimistic lock từ `updatedAt` của row đang mở.
   *
   * @param event Submit event của form; handler chặn navigation mặc định.
   * @remarks Guard khi không có row hoặc mutation pending, parse Zod và kiểm tra role UI trước khi
   * gọi `PATCH /api/staff-users/:userId`. Success đóng modal và báo popup; field error giữ trong
   * form; conflict `STAFF_MODIFIED_SINCE_READ` đóng modal, invalidate cache và yêu cầu mở lại row.
   * Backend vẫn là nguồn quyết định permission, validation và audit.
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
        isActive: editUser.status !== 'locked',
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

      if (!canAssignRoleCode(editRoleOptions, parsedForm.data.roleCode)) {
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
          if (caught instanceof ApiError && caught.code === 'STAFF_MODIFIED_SINCE_READ') {
            void queryClient.invalidateQueries({ queryKey: ['staff-users'] });
            setEditUser(null);
            setEditFieldErrors({});
            setEditFormError('');
            showNotification({
              message: 'Dữ liệu đã thay đổi. Danh sách đã được tải lại, vui lòng mở lại tài khoản.',
              title: 'Dữ liệu đã cũ',
              tone: 'error',
            });
            return;
          }

          if (caught instanceof ApiError && caught.hasFieldErrors) {
            setEditFieldErrors(normalizeEditStaffFieldErrors(caught.fields ?? {}));
          }

          setEditFormError(
            caught instanceof Error ? caught.message : 'Không thể cập nhật tài khoản',
          );
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
    <div className="min-w-[1080px] space-y-5 p-6 font-sans text-[#171c1f]">
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
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .ktv-stat-mini:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,96,150,0.13), 0 2px 6px rgba(0,0,0,0.05);
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

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="text-[11px] font-semibold tracking-[1.4px] text-[#006096] uppercase mb-1">
            QUẢN TRỊ NGƯỜI DÙNG
          </div>
          <div className="text-[22px] font-semibold text-[#171c1f] leading-snug">
            Quản lý tài khoản nhân viên
          </div>
          <div className="text-xs text-[#707882] mt-0.5">
            Quản lý cấp phát tài khoản, cấp lại mật khẩu và kiểm soát trạng thái hoạt động của cán
            bộ y tế trong hệ thống
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
          <select
            aria-label="Lọc theo khoa hoặc phòng"
            className="rounded-lg border border-[#bfc7d2] bg-white px-3 py-2 text-xs text-[#3f4851]"
            onChange={(event) => {
              setDepartmentFilter(event.target.value as DepartmentCode | '');
              setCurrentPage(1);
            }}
            value={departmentFilter}
          >
            <option value="">Tất cả khoa / phòng</option>
            {departmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc theo vai trò"
            className="rounded-lg border border-[#bfc7d2] bg-white px-3 py-2 text-xs text-[#3f4851]"
            onChange={(event) => {
              setRoleFilter(event.target.value as RoleCode | '');
              setCurrentPage(1);
            }}
            value={roleFilter}
          >
            <option value="">Tất cả vai trò</option>
            {createRoleOptions.map((option) => (
              <option key={option.code} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc theo trạng thái"
            className="rounded-lg border border-[#bfc7d2] bg-white px-3 py-2 text-xs text-[#3f4851]"
            onChange={(event) => {
              setStatusFilter(event.target.value as 'all' | 'active' | 'locked');
              setCurrentPage(1);
            }}
            value={statusFilter}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Bị khóa</option>
          </select>
          <button
            className={styles.secondaryButton}
            disabled={!rawUsers.length}
            onClick={() =>
              downloadStaffUsersCsv(
                buildStaffUsersCsv(rawUsers, departmentLabelById, roleLabelByCode),
              )
            }
            type="button"
          >
            <Icon className="h-4 w-4" name="download" />
            Xuất danh sách
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006096] hover:bg-[#004f7e] text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-[0.98] whitespace-nowrap"
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

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="ktv-stat-mini">
          <div className="ktv-stat-mini-label">Tổng tài khoản</div>
          <div className="text-[10px] text-[#707882]">{statsScopeLabel}</div>
          <div className="ktv-stat-mini-value">
            {staffQuery.isLoading ? '...' : totalStaffUsers}
          </div>
        </div>
        <div className="ktv-stat-mini">
          <div className="ktv-stat-mini-label">Đang hoạt động</div>
          <div className="text-[10px] text-[#707882]">{statsScopeLabel}</div>
          <div className="ktv-stat-mini-value" style={{ color: '#1b6e3c' }}>
            {activeStaffCountQuery.isLoading ? '...' : activeCount}
          </div>
        </div>
        <div className="ktv-stat-mini">
          <div className="ktv-stat-mini-label">Bị khóa</div>
          <div className="text-[10px] text-[#707882]">{statsScopeLabel}</div>
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

      <div className="bg-white rounded-2xl border border-[#dfe3e7] shadow-[0_2px_12px_rgba(0,96,150,0.09)] p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="user-table">
            <thead>
              <tr className="bg-[#f0f4f8] text-[11px] font-semibold text-[#707882] uppercase tracking-[0.5px] border-b border-[#dfe3e7]">
                <th className="px-3.5 py-2.5">Mã NV</th>
                <th className="px-3.5 py-2.5">Username</th>
                <th className="px-3.5 py-2.5">Họ và tên</th>
                <th className="px-3.5 py-2.5">Vai trò</th>
                <th className="px-3.5 py-2.5">Khoa / Phòng</th>
                <th className="px-3.5 py-2.5">Số điện thoại</th>
                <th className="px-3.5 py-2.5">Đăng nhập cuối</th>
                <th className="px-3.5 py-2.5">Trạng thái</th>
                <th className="px-3.5 py-2.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {staffQuery.isLoading ? (
                <tr>
                  <td
                    className="px-3.5 py-8 text-center text-xs font-semibold text-[#707882]"
                    colSpan={9}
                  >
                    Đang tải danh sách tài khoản từ API...
                  </td>
                </tr>
              ) : null}
              {staffQuery.isError ? (
                <tr>
                  <td
                    className="px-3.5 py-8 text-center text-xs font-semibold text-[#ba1a1a]"
                    colSpan={9}
                  >
                    Không thể tải danh sách tài khoản nhân viên từ hệ thống.
                  </td>
                </tr>
              ) : null}
              {!staffQuery.isLoading && !staffQuery.isError && users.length === 0 ? (
                <tr>
                  <td
                    className="px-3.5 py-8 text-center text-xs font-semibold text-[#707882]"
                    colSpan={9}
                  >
                    Không có tài khoản nhân viên phù hợp.
                  </td>
                </tr>
              ) : null}
              {!staffQuery.isLoading && !staffQuery.isError
                ? users.map((user) => {
                    const isLocked = user.status === 'locked';
                    const isCurrent = user.status === 'current';

                    return (
                      <tr
                        className={`border-b border-[#dfe3e7] transition-colors hover:bg-[#e8f4ff] ${
                          isLocked ? 'bg-[#f0f4f8]/60 opacity-60' : ''
                        }`}
                        key={user.id}
                      >
                        <td className="px-3.5 py-3 font-mono text-xs text-[#3f4851]">{user.id}</td>
                        <td className="px-3.5 py-3 font-semibold text-[#171c1f]">
                          {user.username}
                        </td>
                        <td className="px-3.5 py-3 font-medium text-[#171c1f]">{user.name}</td>
                        <td className="px-3.5 py-3">
                          <span className={`ktv-chip ${user.chipClass}`}>{user.role}</span>
                        </td>
                        <td className="px-3.5 py-3 text-xs text-[#3f4851]">
                          {departmentLabelById[user.deptCode ?? ''] ?? user.deptCode ?? '—'}
                        </td>
                        <td className="px-3.5 py-3 font-mono text-xs text-[#171c1f]">
                          {user.phone}
                        </td>
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
                            <button
                              className="ktv-btn-action ktv-btn-action-edit"
                              disabled={isLocked}
                              onClick={() => {
                                setEditFormError('');
                                setEditFieldErrors({});
                                setEditUser(user);
                              }}
                              style={
                                isLocked ? { cursor: 'not-allowed', opacity: 0.35 } : undefined
                              }
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

                            <button
                              className="ktv-btn-action ktv-btn-action-key"
                              disabled={isLocked}
                              onClick={() => {
                                if (!user.apiId) {
                                  showNotification({
                                    message:
                                      'Tài khoản chưa có định danh API, vui lòng tải lại dữ liệu từ backend.',
                                    title: 'Không thể cấp lại mật khẩu',
                                    tone: 'error',
                                  });
                                  return;
                                }

                                setResetReason('');
                                setResetTarget(user);
                              }}
                              style={
                                isLocked ? { cursor: 'not-allowed', opacity: 0.35 } : undefined
                              }
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
                  })
                : null}
            </tbody>
          </table>
        </div>

        <div className="mt-3.5 flex items-center justify-between flex-wrap gap-2 text-xs text-[#707882]">
          <span>
            Hiển thị {users.length} / {totalStaffUsers} nhân viên
          </span>
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

      {statusAction ? (
        <div
          className="ktv-modal-overlay"
          onClick={() => {
            if (!updateMutation.isPending) {
              setStatusAction(null);
              setStatusReason('');
            }
          }}
        >
          <div
            aria-labelledby="staff-status-dialog-title"
            aria-modal="true"
            className="ktv-modal max-w-[440px]"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleModalKeyDown}
            role="dialog"
          >
            <h2 className="text-base font-bold text-[#171c1f]" id="staff-status-dialog-title">
              {statusAction.isActive ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
            </h2>
            <p className="mt-2 text-xs leading-5 text-[#707882]">
              Tài khoản: <strong>{statusAction.user.username}</strong>. Hành động này sẽ được ghi
              vào audit log.
            </p>
            <label
              className="mt-4 block text-xs font-semibold text-[#3f4851]"
              htmlFor="staff-status-reason"
            >
              Lý do <span className="text-[#ba1a1a]">*</span>
            </label>
            <textarea
              autoFocus
              className="mt-1 min-h-24 w-full rounded-lg border border-[#bfc7d2] px-3 py-2 text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15"
              id="staff-status-reason"
              maxLength={500}
              onChange={(event) => setStatusReason(event.target.value)}
              placeholder="Nhập lý do tối thiểu 10 ký tự"
              value={statusReason}
            />
            <p className="mt-1 text-[10px] text-[#707882]">
              {statusReason.trim().length}/500 ký tự
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                className="rounded-lg border border-[#bfc7d2] px-4 py-2 text-xs font-semibold text-[#3f4851]"
                disabled={updateMutation.isPending}
                onClick={() => {
                  setStatusAction(null);
                  setStatusReason('');
                }}
                type="button"
              >
                Hủy
              </button>
              <button
                className="rounded-lg bg-[#006096] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                disabled={updateMutation.isPending}
                onClick={() => void executeStatusAction()}
                type="button"
              >
                {updateMutation.isPending ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {resetTarget ? (
        <div
          className="ktv-modal-overlay"
          onClick={() => {
            if (!resetMutation.isPending) {
              setResetTarget(null);
              setResetReason('');
            }
          }}
        >
          <div
            aria-labelledby="reset-password-dialog-title"
            aria-modal="true"
            className="ktv-modal max-w-[440px]"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleModalKeyDown}
            role="dialog"
          >
            <h2 className="text-base font-bold text-[#171c1f]" id="reset-password-dialog-title">
              Cấp lại mật khẩu
            </h2>
            <p className="mt-2 text-xs leading-5 text-[#707882]">
              Tài khoản: <strong>{resetTarget.username}</strong>. Mật khẩu tạm sẽ chỉ hiển thị một
              lần.
            </p>
            <label
              className="mt-4 block text-xs font-semibold text-[#3f4851]"
              htmlFor="reset-password-reason"
            >
              Lý do <span className="text-[#ba1a1a]">*</span>
            </label>
            <textarea
              autoFocus
              className="mt-1 min-h-24 w-full rounded-lg border border-[#bfc7d2] px-3 py-2 text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15"
              id="reset-password-reason"
              maxLength={500}
              onChange={(event) => setResetReason(event.target.value)}
              placeholder="Nhập lý do tối thiểu 10 ký tự"
              value={resetReason}
            />
            <p className="mt-1 text-[10px] text-[#707882]">{resetReason.trim().length}/500 ký tự</p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                className="rounded-lg border border-[#bfc7d2] px-4 py-2 text-xs font-semibold text-[#3f4851]"
                disabled={resetMutation.isPending}
                onClick={() => {
                  setResetTarget(null);
                  setResetReason('');
                }}
                type="button"
              >
                Hủy
              </button>
              <button
                className="rounded-lg bg-[#006096] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                disabled={resetMutation.isPending}
                onClick={() => void executeResetPassword()}
                type="button"
              >
                {resetMutation.isPending ? 'Đang cấp lại...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAddModalOpen ? (
        <div
          className="ktv-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeAddModal();
          }}
        >
          <div
            aria-describedby="create-staff-dialog-description"
            aria-labelledby="create-staff-dialog-title"
            aria-modal="true"
            className="ktv-modal max-h-[calc(100vh-40px)] max-w-[520px] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleModalKeyDown}
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
                      getFirstFieldError(addFieldErrors, 'fullName') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
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
                      getFirstFieldError(addFieldErrors, 'username') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
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
                      getFirstFieldError(addFieldErrors, 'phoneNumber') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
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
                      getFirstFieldError(addFieldErrors, 'identityCardNumber') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
                    )}
                    id={createStaffFieldIds.identityCardNumber}
                    inputMode="numeric"
                    maxLength={12}
                    name="identityCardNumber"
                    onChange={(event) =>
                      updateAddFormField('identityCardNumber', event.target.value)
                    }
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
                      getFirstFieldError(addFieldErrors, 'dateOfBirth') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
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
                      getFirstFieldError(addFieldErrors, 'gender') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
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
                      getFirstFieldError(addFieldErrors, 'roleCode') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
                    )}
                    id={createStaffFieldIds.roleCode}
                    name="roleCode"
                    onChange={(event) => updateAddFormField('roleCode', event.target.value)}
                    required
                    value={addForm.roleCode}
                  >
                    <option value="">-- Chọn vai trò --</option>
                    {createRoleOptions.map((option) => (
                      <option disabled={option.isDisabled} key={option.code} value={option.value}>
                        {option.label}
                        {option.isDisabled ? ' - chỉ admin' : ''}
                      </option>
                    ))}
                  </select>
                  {renderCreateStaffFieldError('roleCode')}
                  {addForm.roleCode === 'director' && !principal.roleCodes.includes('admin') ? (
                    <p className="mt-1 rounded-md border border-[#f2c94c]/40 bg-[#fff8db] px-2 py-1 text-[10px] font-medium text-[#7a5b00]">
                      Tài khoản Giám đốc sau khi tạo chỉ do admin quản lý; KTV IT sẽ không còn thấy
                      hoặc chỉnh sửa được.
                    </p>
                  ) : null}
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
                      getFirstFieldError(addFieldErrors, 'departmentId') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
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
                <p className="mb-3 rounded-lg border border-[#ba1a1a]/25 bg-[#ffdad6]/50 px-3 py-2 text-xs font-medium text-[#ba1a1a]">
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
                  className="min-w-[132px] px-4 py-2 bg-[#006096] hover:bg-[#004f7e] text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
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

      {temporaryPasswordDialog ? (
        <div
          className="ktv-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeTemporaryPasswordDialog();
          }}
        >
          <div
            aria-describedby="temporary-password-dialog-description"
            aria-labelledby="temporary-password-dialog-title"
            aria-modal="true"
            className="ktv-modal max-w-[420px] text-center"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleModalKeyDown}
            role="dialog"
          >
            <button
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f0f4f8] hover:bg-[#e4e9ed] text-[#707882] flex items-center justify-center text-sm font-semibold transition"
              aria-label="Đóng hộp thoại mật khẩu tạm thời"
              onClick={closeTemporaryPasswordDialog}
              ref={temporaryPasswordCloseButtonRef}
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
            <div
              className="text-base font-bold text-[#171c1f] mb-1"
              id="temporary-password-dialog-title"
            >
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
              <div className="ktv-pass-reveal-value">
                {temporaryPasswordDialog.temporaryPassword}
              </div>
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
                className="px-4 py-2 bg-[#006096] hover:bg-[#004f7e] text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-[0.98]"
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

      {editUser ? (
        <div
          className="ktv-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget && !updateMutation.isPending) {
              setEditUser(null);
              setEditFieldErrors({});
              setEditFormError('');
            }
          }}
        >
          <div
            aria-describedby="edit-staff-dialog-description"
            aria-labelledby="edit-staff-dialog-title"
            aria-modal="true"
            className="ktv-modal max-h-[calc(100vh-40px)] max-w-[640px] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleModalKeyDown}
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
              Mã NV: <span className="font-mono font-bold text-[#006096]">{editUser.id}</span> —
              kiểm tra thông tin định danh trước khi lưu.
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
                      getFirstEditFieldError(editFieldErrors, 'fullName') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
                    )}
                    disabled={updateMutation.isPending}
                    id={editStaffFieldIds.fullName}
                    name="fullName"
                    onChange={(event) => updateEditUserField('fullName', event.target.value)}
                    autoFocus
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
                      getFirstEditFieldError(editFieldErrors, 'username') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
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
                      getFirstEditFieldError(editFieldErrors, 'phoneNumber') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
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
                    aria-describedby={getEditFieldDescribedBy(
                      editFieldErrors,
                      'identityCardNumber',
                    )}
                    aria-invalid={Boolean(
                      getFirstEditFieldError(editFieldErrors, 'identityCardNumber'),
                    )}
                    className={cn(
                      'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15',
                      getFirstEditFieldError(editFieldErrors, 'identityCardNumber') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
                    )}
                    disabled={updateMutation.isPending}
                    id={editStaffFieldIds.identityCardNumber}
                    inputMode="numeric"
                    maxLength={12}
                    name="identityCardNumber"
                    onChange={(event) =>
                      updateEditUserField('identityCardNumber', event.target.value)
                    }
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
                      getFirstEditFieldError(editFieldErrors, 'dateOfBirth') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
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
                      getFirstEditFieldError(editFieldErrors, 'gender') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
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
                      getFirstEditFieldError(editFieldErrors, 'roleCode') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
                    )}
                    disabled={updateMutation.isPending}
                    id={editStaffFieldIds.roleCode}
                    name="roleCode"
                    onChange={(event) => updateEditUserField('roleCode', event.target.value)}
                    required
                    value={editUser.roleCode}
                  >
                    {editRoleOptions.map((option) => (
                      <option disabled={option.isDisabled} key={option.code} value={option.value}>
                        {option.label}
                        {option.isDisabled ? ' - chỉ admin' : ''}
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
                      getFirstEditFieldError(editFieldErrors, 'departmentId') &&
                        'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
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
                  Trạng thái tài khoản (dùng nút thao tác ở bảng)
                </label>
                <select
                  aria-describedby={getEditFieldDescribedBy(editFieldErrors, 'isActive')}
                  aria-invalid={Boolean(getFirstEditFieldError(editFieldErrors, 'isActive'))}
                  className={cn(
                    'w-full px-3 py-2 border border-[#bfc7d2] rounded-lg text-xs outline-none focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15 bg-white',
                    getFirstEditFieldError(editFieldErrors, 'isActive') &&
                      'border-[#ba1a1a]/40 bg-[#ffdad6]/25',
                  )}
                  disabled
                  id={editStaffFieldIds.isActive}
                  name="isActive"
                  onChange={(event) =>
                    updateEditUserField('isActive', event.target.value === 'active')
                  }
                  value={editUser.status === 'locked' ? 'locked' : 'active'}
                >
                  <option value="active">Hoạt động</option>
                  <option value="locked">Bị khóa</option>
                </select>
                {renderEditStaffFieldError('isActive')}
              </div>

              {editFormError ? (
                <p className="mb-3 rounded-lg border border-[#ba1a1a]/25 bg-[#ffdad6]/50 px-3 py-2 text-xs font-medium text-[#ba1a1a]">
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
                  className="min-w-[128px] px-4 py-2 bg-[#006096] hover:bg-[#004f7e] text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
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

/* Vùng các tab trình bày còn lại và bộ định tuyến nội bộ của workspace. */
/**
 * Hiển thị lịch sử sao lưu và các action trình bày cho vận hành IT.
 *
 * @remarks Tab hiện tại là read-only presentation state; các nút backup/restore chưa gắn API,
 * loading hoặc error state trong component này.
 */
function BackupContent() {
  return (
    <div className="min-w-[1080px] space-y-6 p-8">
      <PageHeader
        actions={
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
        }
        subtitle="Theo dõi lịch sao lưu, dung lượng bản ghi và trạng thái khôi phục dữ liệu."
        title="Sao lưu & Khôi phục"
      />
      <section className="grid grid-cols-3 gap-6">
        <SummaryCardView
          card={{ helper: '03:30 mỗi ngày', label: 'Lịch sao lưu', tone: 'sky', value: 'Auto' }}
        />
        <SummaryCardView
          card={{
            helper: 'Bản gần nhất 1.24 GB',
            label: 'Dung lượng',
            tone: 'teal',
            value: '18.6 GB',
          }}
        />
        <SummaryCardView
          card={{
            helper: 'Không có lỗi phát sinh',
            label: 'Trạng thái',
            tone: 'green',
            value: 'Ổn định',
          }}
        />
      </section>
      <section className={cn(styles.card, 'overflow-hidden')}>
        <div className="border-b border-[#eaeef2] px-6 py-4">
          <h3 className={styles.sectionTitle}>Lịch sử sao lưu gần nhất</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-[#f0f4f8] text-[11px] font-bold uppercase tracking-[0.5px] text-[#3f4851]">
            <tr>
              {['Thời gian', 'Tên file', 'Dung lượng', 'Loại', 'Trạng thái'].map((head) => (
                <th className="px-6 py-4" key={head}>
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeef2]">
            {[
              [
                '2026-07-18 03:30:00',
                'hms_backup_20260718_030000.sql',
                '1.24 GB',
                'Tự động',
                'Hoàn thành',
              ],
              [
                '2026-07-17 03:30:00',
                'hms_backup_20260717_030000.sql',
                '1.21 GB',
                'Tự động',
                'Hoàn thành',
              ],
              [
                '2026-07-16 22:15:11',
                'hms_manual_before_release.sql',
                '1.20 GB',
                'Thủ công',
                'Hoàn thành',
              ],
            ].map((row) => (
              <tr className="transition-colors hover:bg-[#f6fafe]" key={row[1]}>
                <td className="px-6 py-4 font-mono text-xs">{row[0]}</td>
                <td className="px-6 py-4 font-mono text-xs font-bold">{row[1]}</td>
                <td className="px-6 py-4 text-xs">{row[2]}</td>
                <td className="px-6 py-4 text-xs">{row[3]}</td>
                <td className="px-6 py-4">
                  <ToneBadge tone="green">{row[4]}</ToneBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/** Chọn nội dung tab theo state nội bộ và truyền principal chỉ cho vùng quản lý staff. */
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

/**
 * Root client workspace cho kỹ thuật IT/admin.
 *
 * @param principal Principal đã được server page xác thực.
 * @returns Shell có điều hướng và một tab nội bộ; mặc định là monitoring.
 * @remarks Root sở hữu active tab và callback refresh, còn UsersContent sở hữu server state staff.
 * Refresh chỉ invalidate query `staff-users`; không đổi URL, quyền hoặc payload. Các tab audit/RBAC
 * và backup hiện render presentation state; quyền API nhạy cảm vẫn phải được backend kiểm tra.
 */
export function ItTechnicianWorkspace({ principal }: ItTechnicianWorkspaceProps) {
  const [activePage, setActivePage] = useState<PageKind>('monitoring');
  const queryClient = useQueryClient();

  /**
   * Làm mới các query staff đang hiển thị khi topbar phát sự kiện refresh.
   *
   * @remarks Handler chỉ invalidates cache `staff-users` để React Query refetch theo filter hiện
   * tại; không reset tab, form state, dialog hoặc thay đổi API payload.
   */
  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['staff-users'] });
  };

  return (
    <ItShell activePage={activePage} onChangePage={setActivePage} onRefresh={handleRefresh}>
      <ItTechnicianContent activePage={activePage} principal={principal} />
    </ItShell>
  );
}
