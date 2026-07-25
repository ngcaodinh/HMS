'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { LogoutButton } from '@/shared/auth/logout-button';

import { technicianWorkspaceStyles as styles } from './technician-workspace.styles';

type PageKind = 'queue' | 'result-entry' | 'history' | 'config';
type IconName =
  | 'activity'
  | 'barChart'
  | 'calendar'
  | 'check'
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronRightSmall'
  | 'clock'
  | 'download'
  | 'file'
  | 'flask'
  | 'logOut'
  | 'printer'
  | 'save'
  | 'search'
  | 'shield'
  | 'upload';

type LabOrderStatus = 'Chờ mẫu' | 'Đang thực hiện' | 'Đã có kết quả';
type StatusTone = 'waiting' | 'running' | 'done' | 'urgent' | 'high';

type LabOrder = {
  id: string;
  barcode: string;
  patientName: string;
  patientMeta: string;
  testType: string;
  source: string;
  requestedAt: string;
  status: LabOrderStatus;
  isUrgent?: boolean;
};

type ResultMetric = {
  name: string;
  range: string;
  unit: string;
  value?: string;
  tone?: 'normal' | 'warning' | 'danger';
};

type HistoryItem = {
  id: string;
  patientName: string;
  meta: string;
  testType: string;
  time: string;
  technician: string;
};

type StatCard = {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  tone: 'blue' | 'teal' | 'red' | 'green';
  icon: IconName;
};

const navItems: Array<{ key: PageKind; label: string; badge?: string; icon: IconName }> = [
  { key: 'queue', label: 'Hàng Đợi Xét Nghiệm', badge: '8', icon: 'flask' },
  { key: 'result-entry', label: 'Nhập Kết Quả', icon: 'activity' },
  { key: 'history', label: 'Lịch Sử & Tra Cứu', icon: 'search' },
  { key: 'config', label: 'Cấu Hình & Thống Kê', icon: 'barChart' },
];

const orders: LabOrder[] = [
  {
    id: 'XN-0024',
    barcode: 'LAB250718024',
    patientName: 'PHẠM THỊ HOA',
    patientMeta: '38 tuổi - Nữ',
    testType: 'Hóa sinh máu 22 chỉ số',
    source: 'Khoa Nội Da Liễu - P.105 - BS. Lê Quang Minh',
    requestedAt: '07:12 18/07',
    status: 'Chờ mẫu',
    isUrgent: true,
  },
  {
    id: 'XN-0023',
    barcode: 'LAB250718023',
    patientName: 'NGUYỄN THANH BÌNH',
    patientMeta: '61 tuổi - Nam',
    testType: 'Vi sinh - Kháng sinh đồ',
    source: 'Khoa Ngoại - P.401 - BS. Vũ Hoàng Anh',
    requestedAt: '07:08 18/07',
    status: 'Đang thực hiện',
    isUrgent: true,
  },
  {
    id: 'XN-0022',
    barcode: 'LAB250718022',
    patientName: 'LÊ THỊ THU HƯƠNG',
    patientMeta: '29 tuổi - Nữ',
    testType: 'Nước tiểu thường quy',
    source: 'Khoa Sản - P.208 - BS. Mai Ngọc Lan',
    requestedAt: '06:55 18/07',
    status: 'Chờ mẫu',
  },
  {
    id: 'XN-0021',
    barcode: 'LAB250718021',
    patientName: 'TRẦN VĂN DŨNG',
    patientMeta: '54 tuổi - Nam',
    testType: 'Giải phẫu bệnh sinh thiết',
    source: 'Khoa Da Liễu - P.302 - BS. Đặng Thị Hồng',
    requestedAt: '06:48 18/07',
    status: 'Đã có kết quả',
  },
  {
    id: 'XN-0020',
    barcode: 'LAB250718020',
    patientName: 'VÕ MINH TRÍ',
    patientMeta: '45 tuổi - Nam',
    testType: 'Hóa sinh máu 38 chỉ số',
    source: 'Khoa Nội tổng hợp - P.205 - BS. Trần Quốc Bảo',
    requestedAt: '06:33 18/07',
    status: 'Đang thực hiện',
  },
  {
    id: 'XN-0019',
    barcode: 'LAB250718019',
    patientName: 'NGUYỄN THỊ MỸ LINH',
    patientMeta: '33 tuổi - Nữ',
    testType: 'Vi sinh - Nuôi cấy',
    source: 'Khoa Nhi - P.502 - BS. Chu Thị Lan',
    requestedAt: '06:20 18/07',
    status: 'Chờ mẫu',
    isUrgent: true,
  },
];

const resultMetrics: ResultMetric[] = [
  { name: 'Urê', range: '2,5 - 7,5', unit: 'mmol/L', value: '6.8' },
  { name: 'Glucose', range: '3,9 - 6,4', unit: 'mmol/L', value: '8.2', tone: 'danger' },
  { name: 'Creatinin', range: '62 - 120', unit: 'µmol/L', value: '94' },
  { name: 'Acid Uric', range: '180 - 420', unit: 'µmol/L', value: '430', tone: 'danger' },
  { name: 'Bilirubin T.P', range: '<= 17', unit: 'µmol/L' },
  { name: 'Bilirubin T.T', range: '<= 4,3', unit: 'µmol/L' },
  { name: 'Albumin', range: '35 - 50', unit: 'g/L' },
  { name: 'Globulin', range: '24 - 38', unit: 'g/L' },
  { name: 'Na+', range: '135 - 145', unit: 'mmol/L', value: '132', tone: 'warning' },
  { name: 'K+', range: '3,5 - 5,0', unit: 'mmol/L', value: '5.3', tone: 'warning' },
  { name: 'Calci', range: '2,15 - 2,60', unit: 'mmol/L' },
  { name: 'ALT (GPT)', range: '<= 40', unit: 'U/L' },
];

const historyItems: HistoryItem[] = [
  {
    id: 'PXN-2025-08397',
    patientName: 'LÊ VĂN ĐỨC',
    meta: '48 tuổi - Nam - Nội Da Liễu',
    testType: 'Hóa sinh máu',
    time: '17/07/2025 06:52',
    technician: 'KTV. Nguyễn Thảo',
  },
  {
    id: 'PXN-2025-08342',
    patientName: 'NGUYỄN THỊ BÍCH VÂN',
    meta: '35 tuổi - Nữ - Khoa Sản',
    testType: 'Vi sinh',
    time: '17/07/2025 09:18',
    technician: 'KTV. Phạm Đức Toàn',
  },
  {
    id: 'PXN-2025-08290',
    patientName: 'TRẦN HOÀNG TUẤN',
    meta: '55 tuổi - Nam - Da Liễu',
    testType: 'Giải phẫu bệnh',
    time: '16/07/2025 14:35',
    technician: 'BS. Nguyễn Mạnh Cường',
  },
  {
    id: 'PXN-2025-08215',
    patientName: 'VŨ THỊ MAI ANH',
    meta: '28 tuổi - Nữ - Khoa Nhi',
    testType: 'Hóa sinh máu',
    time: '16/07/2025 08:22',
    technician: 'KTV. Nguyễn Thảo',
  },
];

const signedResults = [
  { name: 'Urê', value: '6.8', range: '2,5 - 7,5', unit: 'mmol/L', status: 'Bình thường' },
  { name: 'Glucose', value: '8.2', range: '3,9 - 6,4', unit: 'mmol/L', status: 'Cao' },
  { name: 'Creatinin', value: '94', range: '62 - 120', unit: 'µmol/L', status: 'Bình thường' },
  { name: 'Cholesterol', value: '6.5', range: '3,9 - 5,2', unit: 'mmol/L', status: 'Cao' },
];

const statCards: StatCard[] = [
  {
    label: 'Tổng mẫu đã tiếp nhận',
    value: '142',
    delta: '+12% so với hôm qua',
    tone: 'blue',
    icon: 'calendar',
  },
  {
    label: 'Mẫu hoàn thành đã ký',
    value: '128',
    delta: '90.1% tỷ lệ hoàn thành',
    tone: 'teal',
    icon: 'check',
  },
  {
    label: 'Ca cấp cứu hoàn thành',
    value: '7',
    delta: 'Ưu tiên xử lý 100%',
    tone: 'red',
    icon: 'clock',
  },
  {
    label: 'TAT trung bình',
    value: '38',
    unit: 'phút',
    delta: 'Giảm 5 phút so với hôm qua',
    tone: 'green',
    icon: 'activity',
  },
];

const referenceRows = [
  ['HSM-001', 'Urê', 'mmol/L', '2.5', '7.5', 'Tất cả'],
  ['HSM-002', 'Glucose', 'mmol/L', '3.9', '6.4', 'Tất cả'],
  ['HSM-003', 'Creatinin', 'µmol/L', '62', '120', 'Nam'],
  ['HSM-003b', 'Creatinin', 'µmol/L', '53', '100', 'Nữ'],
  ['HSM-004', 'Cholesterol', 'mmol/L', '3.9', '5.2', 'Tất cả'],
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Icon({ className, name }: { className?: string; name: IconName }) {
  const stroke = 'stroke-current';

  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      {name === 'activity' && (
        <path className={stroke} d="M4 13h4l2-6 4 10 2-4h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      )}
      {name === 'barChart' && (
        <path className={stroke} d="M5 19V9m7 10V5m7 14v-7" strokeLinecap="round" strokeWidth="2" />
      )}
      {name === 'calendar' && (
        <path className={stroke} d="M7 3v3m10-3v3M5 9h14M6 5h12a1 1 0 0 1 1 1v13H5V6a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      )}
      {name === 'check' && (
        <path className={stroke} d="m5 12.5 4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      )}
      {name === 'chevronLeft' && (
        <path className={stroke} d="m14 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      )}
      {name === 'chevronRight' && (
        <path className={stroke} d="m10 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      )}
      {name === 'chevronRightSmall' && (
        <path className={stroke} d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      )}
      {name === 'clock' && (
        <path className={stroke} d="M12 7v5l3 2m5-2a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      )}
      {name === 'download' && (
        <path className={stroke} d="M12 4v10m0 0 4-4m-4 4-4-4M5 20h14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      )}
      {name === 'file' && (
        <path className={stroke} d="M7 3h7l4 4v14H7V3Zm7 0v5h5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      )}
      {name === 'flask' && (
        <path className={stroke} d="M9 3h6M10 3v5l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      )}
      {name === 'logOut' && (
        <path className={stroke} d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6.5A1.5 1.5 0 0 1 10 18.5V17M4 12h10m0 0-3-3m3 3-3 3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      )}
      {name === 'printer' && (
        <path className={stroke} d="M7 8V4h10v4M7 17H5V9h14v8h-2m-10 0h10v4H7v-4Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      )}
      {name === 'save' && (
        <path className={stroke} d="M5 5h12l2 2v12H5V5Zm3 0v6h7V5M8 19v-5h8v5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      )}
      {name === 'search' && (
        <path className={stroke} d="m20 20-4.2-4.2M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      )}
      {name === 'shield' && (
        <path className={stroke} d="M12 3 5 6v5c0 4.2 2.7 7.6 7 10 4.3-2.4 7-5.8 7-10V6l-7-3Zm-3 9 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      )}
      {name === 'upload' && (
        <path className={stroke} d="M12 16V5m0 0-4 4m4-4 4 4M5 19h14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      )}
    </svg>
  );
}

function StatusPill({ status, tone }: { status: string; tone: StatusTone }) {
  const toneClass = {
    done: 'bg-[#dcfce7] text-[#166534]',
    high: 'bg-[#fee2e2] text-[#dc2626]',
    running: 'bg-[#cbe7f5] text-[#006096]',
    urgent: 'bg-[#ffdad6] text-[#ba1a1a]',
    waiting: 'bg-[#ffdea5] text-[#7a5200]',
  }[tone];

  const dotClass = {
    done: 'bg-[#16a34a]',
    high: 'bg-[#dc2626]',
    running: 'bg-[#006096]',
    urgent: 'bg-[#ba1a1a]',
    waiting: 'bg-[#7a5200]',
  }[tone];

  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-bold', toneClass)}>
      <span className={cn('h-2 w-2 rounded-[4px]', dotClass)} />
      {status}
    </span>
  );
}

function SearchBox({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="relative block w-full max-w-[380px]">
      <span className="sr-only">{label}</span>
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#707882]" name="search" />
      <input className={styles.searchInput} placeholder={placeholder} type="search" />
    </label>
  );
}

function LabSidebar({
  active,
  onChangePage,
}: {
  active: PageKind;
  onChangePage: (page: PageKind) => void;
}) {
  return (
    <aside className={styles.sidebar} aria-label="Thanh điều hướng xét nghiệm">
      <div className={styles.sidebarHeader}>
        <div className="flex items-center gap-2">
          <div className={styles.logoMark}>
            <Image alt="HMS-VN" height={34} priority src="/hms-login-logo.png" width={34} />
          </div>
          <div>
            <p className="text-[15px] font-bold leading-5">HMS-VN</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.4px] text-white/55">
              Hệ thống quản lý bệnh viện
            </p>
          </div>
        </div>
      </div>

      <nav className={styles.nav}>
        <p className={styles.navSection}>Xét nghiệm</p>
        {navItems.slice(0, 3).map((item) => (
          <button
            aria-current={active === item.key ? 'page' : undefined}
            className={cn(styles.navItem, active === item.key && styles.navItemActive)}
            key={item.key}
            onClick={() => onChangePage(item.key)}
            type="button"
          >
            <Icon className={styles.navIcon} name={item.icon} />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.badge ? (
              <span className="rounded-full bg-[#ba1a1a] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}

        <p className={styles.navSection}>Quản lý</p>
        <button
          aria-current={active === 'config' ? 'page' : undefined}
          className={cn(styles.navItem, active === 'config' && styles.navItemActive)}
          onClick={() => onChangePage('config')}
          type="button"
        >
          <Icon className={styles.navIcon} name="barChart" />
          <span className="truncate">Cấu Hình & Thống Kê</span>
        </button>
      </nav>

      <div className={styles.sidebarFooter}>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-white text-[#006096]">
          <Icon className="h-7 w-7" name="flask" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-5">KTV. Nguyễn Thảo</p>
          <p className="text-[11px] leading-4 text-white/50">Kỹ thuật viên - Xét nghiệm</p>
        </div>
        <LogoutButton className="rounded-md border border-white/10 p-2.5 text-white/70">
          <Icon className="h-4 w-4" name="logOut" />
        </LogoutButton>
      </div>
    </aside>
  );
}

function LabTopbar({ page }: { page: PageKind }) {
  const title = {
    config: 'Cấu Hình & Thống Kê Hoạt Động',
    history: 'Lịch Sử & Tra Cứu Kết Quả',
    queue: 'Hàng Đợi Chỉ Định Xét Nghiệm',
    'result-entry': 'Nhập Chi Tiết Kết Quả Xét Nghiệm',
  }[page];

  return (
    <header className={styles.topbar}>
      <h1 className="min-w-0 truncate text-[15px] font-bold text-[#171c1f]">{title}</h1>
      <div className="flex shrink-0 items-center gap-4 text-[12px]">
        <span className="inline-flex items-center gap-2 font-medium text-[#166534]">
          <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
          Đồng bộ thời gian thực
        </span>
        <span className="hidden text-[#64748b] sm:inline">22:33 - Chủ nhật, 19/07/2026</span>
      </div>
    </header>
  );
}

function LabShell({
  children,
  onChangePage,
  page,
}: {
  children: ReactNode;
  onChangePage: (page: PageKind) => void;
  page: PageKind;
}) {
  return (
    <main className={styles.shell}>
      <LabSidebar active={page} onChangePage={onChangePage} />
      <section className={styles.workspace}>
        <LabTopbar page={page} />
        <div className={styles.content}>{children}</div>
        <footer className={styles.footer}>© 2026 HMS-VN Solution. All rights reserved.</footer>
      </section>
    </main>
  );
}

function getOrderStatusTone(status: LabOrderStatus): StatusTone {
  if (status === 'Đang thực hiện') return 'running';
  if (status === 'Đã có kết quả') return 'done';

  return 'waiting';
}

/**
 * Hiển thị thông báo Toast góc dưới bên phải màn hình.
 */
function ToastContainer({ toasts }: { toasts: Array<{ id: number; message: string; type: 'success' | 'warning' | 'info' | 'error' }> }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2">
      {toasts.map((toast) => {
        const bg = {
          error: 'bg-[#ba1a1a]',
          info: 'bg-[#004e8c]',
          success: 'bg-[#1a7a4a]',
          warning: 'bg-[#a05c00]',
        }[toast.type];

        return (
          <div
            className={cn(
              'flex max-w-[420px] items-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-medium text-white shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-right-10',
              bg,
            )}
            key={toast.id}
          >
            <Icon className="h-4 w-4 shrink-0" name="check" />
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Modal xác nhận cấp phát thuốc và trừ kho FEFO.
 */
function DispenseModal({
  onClose,
  onConfirm,
  patientId,
  patientName,
  rxCode,
}: {
  onClose: () => void;
  onConfirm: () => void;
  patientId: string;
  patientName: string;
  rxCode: string;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={cn(styles.modalIcon, styles.modalIconPrimary)}>
            <Icon className="h-5 w-5" name="check" />
          </div>
          <div>
            <div className={styles.modalTitle}>Xác nhận cấp phát thuốc &amp; Trừ kho FEFO</div>
            <div className={styles.modalSub}>
              Đơn thuốc {rxCode} · Bệnh nhân: {patientName}
            </div>
          </div>
        </div>
        <div className={styles.modalBody}>
          <ul className={styles.modalChecklist}>
            <li className={styles.modalChecklistItem}>
              <Icon className="h-4 w-4 shrink-0 text-[#1a7a4a]" name="check" />
              <span>Đúng bệnh nhân: {patientName} (<span className="font-mono">{patientId}</span>)</span>
            </li>
            <li className={styles.modalChecklistItem}>
              <Icon className="h-4 w-4 shrink-0 text-[#1a7a4a]" name="check" />
              <span>Đúng đơn thuốc &amp; chữ ký bác sĩ (BS. Lê Thành Tâm — 「Đã ký」)</span>
            </li>
            <li className={styles.modalChecklistItem}>
              <Icon className="h-4 w-4 shrink-0 text-[#1a7a4a]" name="check" />
              <span>Đúng 2 khoản thuốc &amp; liều dùng</span>
            </li>
            <li className={styles.modalChecklistItem}>
              <Icon className="h-4 w-4 shrink-0 text-[#1a7a4a]" name="check" />
              <span>Đã gán trừ lô FEFO: <span className="font-mono">LOT-20260412</span> &amp; <span className="font-mono">LOT-20260301</span></span>
            </li>
          </ul>
          <div className={cn(styles.alert, styles.alertInfo)}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" name="shield" />
            <div>
              Hệ thống sẽ lưu vết <code className="rounded bg-white/60 px-1 font-mono">dispensedBy = DS. Phạm Thanh Hà</code> và thời điểm phát <code className="rounded bg-white/60 px-1 font-mono">dispensedAt</code>. Đơn thuốc sau khi phát sẽ không được chỉnh sửa.
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={cn(styles.btn, styles.btnGhost)} onClick={onClose} type="button">
            Hủy bỏ
          </button>
          <button className={cn(styles.btn, styles.btnPrimary)} onClick={onConfirm} type="button">
            Xác nhận phát thuốc
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal từ chối cấp phát đơn thuốc.
 */
function RejectModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={cn(styles.modalIcon, styles.modalIconError)}>
            <Icon className="h-5 w-5" name="logOut" />
          </div>
          <div>
            <div className={styles.modalTitle}>Từ chối cấp phát đơn thuốc</div>
            <div className={styles.modalSub}>Gửi yêu cầu điều chỉnh đơn thuốc cho Bác sĩ kê đơn</div>
          </div>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Lý do từ chối cấp phát * (tối thiểu 10 ký tự)</label>
            <textarea
              className={cn(styles.formControl, 'h-24 resize-y')}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do chuyên môn: Tương tác thuốc nguy hiểm, Thuốc tạm hết hàng..."
              value={reason}
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={cn(styles.btn, styles.btnGhost)} onClick={onClose} type="button">
            Hủy bỏ
          </button>
          <button className={cn(styles.btn, styles.btnError)} onClick={onConfirm} type="button">
            Gửi phản hồi cho Bác sĩ
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal xác nhận đăng xuất hệ thống.
 */
function LogoutModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={cn(styles.modal, 'max-w-[360px]')} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={cn(styles.modalIcon, styles.modalIconError)}>
            <Icon className="h-5 w-5" name="logOut" />
          </div>
          <div>
            <div className={styles.modalTitle}>Đăng xuất hệ thống</div>
            <div className={styles.modalSub}>Bạn có chắc muốn kết thúc ca trực?</div>
          </div>
        </div>
        <div className={styles.modalBody}>
          <div className={cn(styles.alert, styles.alertWarning)}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" name="shield" />
            <div>Vui lòng đảm bảo đã hoàn tất các đơn thuốc cấp phát trong ca trước khi đăng xuất.</div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={cn(styles.btn, styles.btnGhost)} onClick={onClose} type="button">
            Ở lại
          </button>
          <button className={cn(styles.btn, styles.btnError)} onClick={onConfirm} type="button">
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Component hiển thị màn hình Hàng Đợi Chỉ Định Xét Nghiệm.
 * Giao diện, các thành phần UI và popup tương tác được chuẩn hóa đồng bộ 100% theo doc/duoc_si copy.html.
 *
 * @returns React Element khung danh sách hàng đợi, thẻ chi tiết xử lý đơn thuốc và các popup modal.
 */
function QueuePageContent() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('kho-a');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeChip, setActiveChip] = useState<string>('pending');
  const [selectedRx, setSelectedRx] = useState<string>('0891');
  const [activeModal, setActiveModal] = useState<'none' | 'dispense' | 'reject' | 'logout'>('none');
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'warning' | 'info' | 'error' }>>([]);
  const [dispensedMap, setDispensedMap] = useState<Record<string, boolean>>({});

  // Tự động hiển thị toast notification
  const addToast = (message: string, type: 'success' | 'warning' | 'info' | 'error') => {
    const newToast = { id: Date.now(), message, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3800);
  };

  // Danh sách đơn thuốc hàng đợi chuẩn hóa từ doc/duoc_si copy.html
  const queueItems = [
    {
      id: '0891',
      code: '#RX-2026-0891',
      patientName: 'Nguyễn Thị Lan',
      patientId: 'BN-2026-0089',
      patientMeta: 'Nữ (41T)',
      patientType: 'ngoaitru',
      typeBadge: 'Ngoại trú BHYT 80%',
      department: 'Khoa Da Liễu — P.201',
      doctor: 'BS. Lê Thành Tâm',
      signer: '「Đã ký」 BS. Tâm',
      warning: 'Cảnh báo Penicillin',
      hasWarning: true,
      status: dispensedMap['0891'] ? 'dispensed' : 'pending',
      statusLabel: dispensedMap['0891'] ? 'Đã cấp phát' : 'Chờ phát',
      isBgHighlight: true,
    },
    {
      id: '0892',
      code: '#RX-2026-0892',
      patientName: 'Trần Minh Đức',
      patientId: 'BN-2026-0091',
      patientMeta: 'Nam (35T)',
      patientType: 'noitru',
      typeBadge: 'Nội trú',
      department: 'Nội trú Da Liễu — Buồng 3',
      doctor: 'BS. Nguyễn Văn B',
      signer: '「Đã ký」 BS. B',
      warning: '—',
      hasWarning: false,
      status: dispensedMap['0892'] ? 'dispensed' : 'pending',
      statusLabel: dispensedMap['0892'] ? 'Đã cấp phát' : 'Chờ phát',
      isBgHighlight: false,
    },
    {
      id: '0885',
      code: '#RX-2026-0885',
      patientName: 'Lê Thị Hương',
      patientId: 'BN-2026-0085',
      patientMeta: 'Nữ (58T)',
      patientType: 'ngoaitru',
      typeBadge: 'Ngoại trú BHYT 100%',
      department: 'Khoa Da Liễu — P.103',
      doctor: 'BS. Lê Thành Tâm',
      signer: '「Đã ký」 BS. Tâm',
      warning: '—',
      hasWarning: false,
      status: 'dispensed',
      statusLabel: 'Đã cấp phát',
      isBgHighlight: false,
    },
  ];

  // Lọc dữ liệu hàng đợi
  const filteredQueue = queueItems.filter((item) => {
    if (activeChip === 'pending' && item.status !== 'pending') return false;
    if (activeChip === 'dispensed' && item.status !== 'dispensed') return false;
    if (activeChip === 'outpatient' && item.patientType !== 'ngoaitru') return false;
    if (activeChip === 'inpatient' && item.patientType !== 'noitru') return false;
    if (activeChip === 'allergy' && !item.hasWarning) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        item.code.toLowerCase().includes(q) ||
        item.patientName.toLowerCase().includes(q) ||
        item.patientId.toLowerCase().includes(q) ||
        item.doctor.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleWarehouseChange = (val: string) => {
    setSelectedWarehouse(val);
    const name = val === 'kho-a' ? 'Kho Ngoại Trú A' : val === 'kho-b' ? 'Kho Nội Trú B' : 'Tất cả kho';
    addToast(`Đã lọc danh sách đơn thuốc theo: ${name}`, 'info');
  };

  const handleReload = () => {
    addToast('Đã nạp lại danh sách đơn thuốc mới nhất', 'success');
  };

  const handlePrintLabel = () => {
    addToast('Đã gửi lệnh in nhãn hướng dẫn sử dụng thuốc tới máy in nhiệt!', 'success');
  };

  const handleConfirmDispense = () => {
    setDispensedMap((prev) => ({ ...prev, [selectedRx]: true }));
    setActiveModal('none');
    addToast(`Cấp phát thuốc thành công! Đã gán dispensedBy và trừ kho FEFO cho đơn #RX-2026-${selectedRx}`, 'success');
  };

  const handleConfirmReject = () => {
    setActiveModal('none');
    addToast('Đã gửi phản hồi từ chối đơn thuốc tới Bác sĩ kê đơn.', 'warning');
  };

  const handleConfirmLogout = () => {
    setActiveModal('none');
    addToast('Đang kết thúc ca trực và đăng xuất khỏi hệ thống...', 'warning');
  };

  const selectedItem = queueItems.find((i) => i.id === selectedRx) || queueItems[0];

  return (
    <div className="space-y-6 p-6">
      {/* Screen Header */}
      <div className={styles.screenHeader}>
        <div>
          <h2 className={styles.screenTitle}>Cấp phát thuốc theo đơn</h2>
          <p className={styles.screenSubtitle}>
            Danh sách đơn thuốc điện tử đã ký bác sĩ chờ phát — Ca trực 20/07/2026
          </p>
        </div>
        <div className={styles.screenActions}>
          <select
            aria-label="Chọn kho xuất"
            className={styles.selectField}
            onChange={(e) => handleWarehouseChange(e.target.value)}
            value={selectedWarehouse}
          >
            <option value="all">Tất cả kho xuất</option>
            <option value="kho-a">Kho Ngoại Trú A</option>
            <option value="kho-b">Kho Nội Trú B</option>
          </select>
          <button
            aria-label="Tải danh sách đơn thuốc mới"
            className={cn(styles.btn, styles.btnGhost, styles.btnSm)}
            onClick={handleReload}
            type="button"
          >
            <Icon className="h-4 w-4" name="activity" />
            Tải đơn mới
          </button>
        </div>
      </div>

      {/* Queue Table Card */}
      <div className={styles.card}>
        <div className="border-b border-[#e4e9ed] px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className={styles.searchInputWrap} style={{ maxWidth: '360px' }}>
              <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#707882]" name="search" />
              <input
                aria-label="Tìm kiếm đơn thuốc"
                className={styles.searchInput}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo Mã đơn, Mã BN, Họ tên, Bác sĩ..."
                type="text"
                value={searchQuery}
              />
            </div>
            <div className={styles.chipBar}>
              <button
                className={cn(styles.chip, activeChip === 'pending' && styles.chipActive)}
                onClick={() => setActiveChip('pending')}
                type="button"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#a05c00]" />
                Chờ cấp phát (2)
              </button>
              <button
                className={cn(styles.chip, activeChip === 'dispensed' && styles.chipActive)}
                onClick={() => setActiveChip('dispensed')}
                type="button"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#1a7a4a]" />
                Đã cấp phát
              </button>
              <button
                className={cn(styles.chip, activeChip === 'outpatient' && styles.chipActive)}
                onClick={() => setActiveChip('outpatient')}
                type="button"
              >
                Ngoại trú
              </button>
              <button
                className={cn(styles.chip, activeChip === 'inpatient' && styles.chipActive)}
                onClick={() => setActiveChip('inpatient')}
                type="button"
              >
                Nội trú
              </button>
              <button
                className={cn(styles.chip, activeChip === 'allergy' && styles.chipActive)}
                onClick={() => setActiveChip('allergy')}
                type="button"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#ba1a1a]" />
                Cảnh báo dị ứng
              </button>
            </div>
          </div>
        </div>

        <div className={styles.dataTableWrap}>
          <table className={styles.dataTable} id="rx-queue-table">
            <thead>
              <tr>
                <th className={styles.th}>Mã đơn thuốc</th>
                <th className={styles.th}>Bệnh nhân &amp; BHYT</th>
                <th className={styles.th}>Khoa / Bác sĩ kê</th>
                <th className={styles.th}>Cảnh báo chuyên môn</th>
                <th className={cn(styles.th, 'text-center')}>Trạng thái</th>
                <th className={cn(styles.th, 'text-center')}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.map((item) => {
                const isSelected = selectedRx === item.id;

                return (
                  <tr
                    className={cn(styles.tr, (isSelected || item.isBgHighlight) && 'bg-[#fff9e6]')}
                    key={item.id}
                  >
                    <td className={styles.td}>
                      <span className="font-mono text-[12.5px] font-bold text-[#006096]">{item.code}</span>
                    </td>
                    <td className={styles.td}>
                      <div className="font-bold text-[#171c1f]">{item.patientName}</div>
                      <div className="text-[12px] text-[#3f4851]">
                        <span className="font-mono">{item.patientId}</span> · {item.patientMeta}
                      </div>
                      <div className="mt-0.5">
                        <span className={cn(styles.badge, item.patientType === 'ngoaitru' ? styles.badgeNgoaitru : styles.badgeNoitru)}>
                          {item.typeBadge}
                        </span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className="text-[11.5px] text-[#3f4851]">{item.department}</div>
                      <div className="mt-0.5 font-bold text-[#171c1f]">{item.doctor}</div>
                      <div className="mt-0.5">
                        <span className={styles.signStampBadge}>{item.signer}</span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      {item.hasWarning ? (
                        <span className={cn(styles.badge, styles.badgeWriteoff)}>
                          <Icon className="h-3 w-3" name="shield" />
                          {item.warning}
                        </span>
                      ) : (
                        <span className="text-[#3f4851]">—</span>
                      )}
                    </td>
                    <td className={cn(styles.td, 'text-center')}>
                      {item.status === 'pending' ? (
                        <span className={cn(styles.badge, styles.badgePending)}>
                          <span className={styles.badgeDot} />
                          {item.statusLabel}
                        </span>
                      ) : (
                        <span className={cn(styles.badge, styles.badgePaid)}>
                          <span className={styles.badgeDot} />
                          {item.statusLabel}
                        </span>
                      )}
                    </td>
                    <td className={cn(styles.td, 'text-center')}>
                      {item.status === 'pending' ? (
                        <button
                          aria-label={`Xử lý phát thuốc đơn ${item.id}`}
                          className={cn(styles.btn, styles.btnPrimary, styles.btnSm)}
                          onClick={() => {
                            setSelectedRx(item.id);
                            addToast(`Đã nạp thông tin chi tiết đơn thuốc #${item.code}`, 'info');
                          }}
                          type="button"
                        >
                          <Icon className="h-3.5 w-3.5" name="activity" />
                          Xử lý phát thuốc
                        </button>
                      ) : (
                        <button
                          aria-label={`Xem đơn thuốc ${item.id}`}
                          className={cn(styles.btn, styles.btnGhost, styles.btnSm)}
                          onClick={() => {
                            setSelectedRx(item.id);
                            addToast(`Đã nạp thông tin chi tiết đơn thuốc #${item.code}`, 'info');
                          }}
                          type="button"
                        >
                          <Icon className="h-3.5 w-3.5" name="search" />
                          Xem đơn
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPENSING WORKAREA FOR SELECTED RX (#RX-2026-0891) */}
      <div className={styles.card} id="rx-dispense-workarea">
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <Icon className="h-4 w-4 text-[#006096]" name="file" />
            Chi tiết đơn thuốc điện tử: <span className="font-mono text-[#006096]">{selectedItem.code}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={styles.signStampBadge}>{selectedItem.signer}</span>
            <span className={cn(styles.badge, selectedItem.status === 'pending' ? styles.badgePending : styles.badgePaid)}>
              <span className={styles.badgeDot} />
              {selectedItem.statusLabel}
            </span>
          </div>
        </div>
        <div className={styles.cardBody}>
          {/* Patient Summary Grid */}
          <div className="mb-6 grid grid-cols-1 border-b border-[#e4e9ed] pb-4 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#3f4851]">
                Bệnh nhân
              </label>
              <span className="text-[13.5px] font-bold text-[#171c1f]">
                {selectedItem.patientName} <span className="font-normal">({selectedItem.patientMeta})</span>
              </span>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#3f4851]">
                Mã BN / BHYT
              </label>
              <span className="text-[13.5px] font-medium text-[#171c1f]">
                <span className="font-mono text-[#006096]">{selectedItem.patientId}</span> · <span className="font-mono">HS4-0100-3500-2026</span>
              </span>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#3f4851]">
                Chẩn đoán (ICD-10)
              </label>
              <span className="text-[13.5px] font-medium text-[#171c1f]">
                Viêm da tiếp xúc dị ứng (<span className="font-mono">L23.9</span>)
              </span>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#3f4851]">
                Bác sĩ kê đơn
              </label>
              <span className="text-[13.5px] font-medium text-[#171c1f]">{selectedItem.doctor} ({selectedItem.department})</span>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#3f4851]">
                Thời điểm ký đơn
              </label>
              <span className="font-mono text-[13.5px] text-[#171c1f]">20/07/2026 07:32</span>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#3f4851]">
                Trạng thái hóa đơn
              </label>
              <span className={cn(styles.badge, styles.badgePaid)}>
                Đã thanh toán viện phí (<span className="font-mono">#INV-2026-0312</span>)
              </span>
            </div>
          </div>

          {/* Allergy Override Warning Alert */}
          {selectedItem.hasWarning && (
            <div className={cn(styles.alert, styles.alertError, 'mb-6')} id="rx-allergy-alert">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" name="shield" />
              <div>
                <strong className="mb-0.5 block">
                  CẢNH BÁO DỊ ỨNG &amp; GHI ĐÈ CHUYÊN MÔN (ALLERGY OVERRIDE):
                </strong>
                Bệnh nhân có tiền sử dị ứng nhóm Penicillin. Bác sĩ kê đơn đã xác nhận ghi đè (Override):{' '}
                <em>&ldquo;Đã kiểm tra hoạt chất Cetirizine &amp; Clobetasol không thuộc nhóm B-lactam, an toàn sử dụng cho bệnh nhân&rdquo;</em>{' '}
                <span className="font-mono text-[12px] text-[#3f4851]">
                  (Bác sĩ: {selectedItem.doctor} · 20/07/2026 07:32 · Override ID: #ALR-8812)
                </span>
              </div>
            </div>
          )}

          {/* Prescription Items & FEFO Allocation Table */}
          <h4 className="mb-2 text-[13px] font-bold uppercase tracking-[0.5px] text-[#3f4851]">
            Danh mục thuốc kê &amp; Đề xuất trừ lô FEFO
          </h4>
          <div className={cn(styles.dataTableWrap, 'mb-6')}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th className={styles.th}>Tên thuốc / Hoạt chất / Dạng</th>
                  <th className={cn(styles.th, 'text-center')}>SL kê</th>
                  <th className={styles.th}>Liều dùng &amp; Hướng dẫn bác sĩ</th>
                  <th className={styles.th}>Lô xuất FEFO đề xuất</th>
                  <th className={cn(styles.th, 'text-center')}>Hạn sử dụng</th>
                  <th className={cn(styles.th, 'text-center')}>Kiểm tra tồn kho</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.tr}>
                  <td className={styles.td}>
                    <div className="text-[13.5px] font-bold text-[#171c1f]">Clobetasol Propionate 0.05%</div>
                    <div className="text-[12px] text-[#3f4851]">Tuýp 30g · Thuốc bôi ngoài da</div>
                  </td>
                  <td className={cn(styles.td, 'text-center')}>
                    <span className="font-mono text-[15px] font-bold">2</span> tuýp
                  </td>
                  <td className={styles.td}>
                    <span className="font-bold">Bôi mỏng vùng da tổn thương 2 lần/ngày</span> (Sáng - Tối)
                  </td>
                  <td className={styles.td}>
                    <span className="font-mono font-bold text-[#006096]">LOT-20260412</span>
                    <div className="text-[12px] text-[#3f4851]">
                      Vị trí: Kệ A-02 · Tồn: <span className="font-mono">1.450</span> tuýp
                    </div>
                  </td>
                  <td className={cn(styles.td, 'text-center')}>
                    <span className="font-mono">15/10/2027</span>
                  </td>
                  <td className={cn(styles.td, 'text-center')}>
                    <span className={cn(styles.badge, styles.badgePaid)}>Đủ tồn FEFO</span>
                  </td>
                </tr>
                <tr className={styles.tr}>
                  <td className={styles.td}>
                    <div className="text-[13.5px] font-bold text-[#171c1f]">Cetirizin 10mg</div>
                    <div className="text-[12px] text-[#3f4851]">Hộp 30 viên · Thuốc kháng histamin</div>
                  </td>
                  <td className={cn(styles.td, 'text-center')}>
                    <span className="font-mono text-[15px] font-bold">1</span> hộp
                  </td>
                  <td className={styles.td}>
                    <span className="font-bold">Uống 1 viên vào buổi tối sau khi ăn</span>
                  </td>
                  <td className={styles.td}>
                    <span className="font-mono font-bold text-[#006096]">LOT-20260301</span>
                    <div className="text-[12px] text-[#3f4851]">
                      Vị trí: Kệ B-05 · Tồn: <span className="font-mono">820</span> hộp
                    </div>
                  </td>
                  <td className={cn(styles.td, 'text-center')}>
                    <span className="font-mono">20/05/2027</span>
                  </td>
                  <td className={cn(styles.td, 'text-center')}>
                    <span className={cn(styles.badge, styles.badgePaid)}>Đủ tồn FEFO</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Actions & 5-Right Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e4e9ed] pt-4">
            <div className="flex items-center gap-1.5 text-[12px] text-[#004e8c]">
              <Icon className="h-4 w-4 shrink-0" name="shield" />
              Quy tắc 5 đúng Dược phẩm: Đúng bệnh nhân · Đúng thuốc · Đúng liều · Đúng đường dùng · Đúng thời gian
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Từ chối hoặc trả đơn thuốc cho bác sĩ"
                className={cn(styles.btn, styles.btnErrorOutline)}
                onClick={() => setActiveModal('reject')}
                type="button"
              >
                <Icon className="h-4 w-4" name="logOut" />
                Từ chối / Trả đơn
              </button>
              <button
                aria-label="In nhãn hướng dẫn dùng thuốc"
                className={cn(styles.btn, styles.btnGhost)}
                onClick={handlePrintLabel}
                type="button"
              >
                <Icon className="h-4 w-4" name="printer" />
                In nhãn hướng dẫn
              </button>
              <button
                aria-label="Xác nhận cấp phát thuốc và trừ kho FEFO"
                className={cn(styles.btn, styles.btnPrimary, styles.btnLg)}
                onClick={() => setActiveModal('dispense')}
                type="button"
              >
                <Icon className="h-4 w-4" name="check" />
                Xác nhận cấp phát &amp; Trừ kho FEFO
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Popups & Toast Components */}
      {activeModal === 'dispense' && (
        <DispenseModal
          onClose={() => setActiveModal('none')}
          onConfirm={handleConfirmDispense}
          patientId={selectedItem.patientId}
          patientName={selectedItem.patientName}
          rxCode={selectedItem.code}
        />
      )}

      {activeModal === 'reject' && (
        <RejectModal
          onClose={() => setActiveModal('none')}
          onConfirm={handleConfirmReject}
        />
      )}

      {activeModal === 'logout' && (
        <LogoutModal
          onClose={() => setActiveModal('none')}
          onConfirm={handleConfirmLogout}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}

function ResultEntryPageContent() {
  return (
    <div className="grid min-w-[1040px] grid-cols-[minmax(0,1fr)_360px] bg-white">
      <section className="min-w-0 border-r border-[#bfc7d2]">
        <div className="border-b border-[#bfc7d2] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={styles.sectionTitle}>Phiếu xét nghiệm - XN-0024</p>
              <h2 className="mt-2 text-2xl font-bold text-[#171c1f]">PHẠM THỊ HOA</h2>
              <p className="mt-1 text-xs font-medium text-[#707882]">
                38 tuổi - Nữ - Hóa sinh máu 22 chỉ số - Cấp cứu
              </p>
            </div>
            <StatusPill status="Chưa ký duyệt" tone="high" />
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-sm font-bold uppercase text-[#006096]">Nhập kết quả định lượng</h3>
            <button className={styles.secondaryButton} type="button">
              <Icon className="h-4 w-4" name="download" />
              Tải mẫu máy xét nghiệm
            </button>
          </div>
          <div className="overflow-hidden border border-[#bfc7d2]">
            <div className="grid grid-cols-2">
              {resultMetrics.map((metric, index) => (
                <div
                  className={cn(
                    'grid grid-cols-[1fr_80px_68px_72px] border-b border-[#bfc7d2]',
                    index % 4 > 1 && 'bg-[#f8f9fe]',
                  )}
                  key={`${metric.name}-${index}`}
                >
                  <span className="border-r border-[#bfc7d2] px-3 py-4 font-medium">{metric.name}</span>
                  <span className="border-r border-[#bfc7d2] px-3 py-3 text-[11.5px] leading-[17px] text-[#6b7280]">
                    {metric.range}
                  </span>
                  <span className="flex items-center justify-center border-r border-[#bfc7d2] p-2">
                    <input
                      aria-label={`Nhập kết quả ${metric.name}`}
                      className={cn(
                        'h-9 w-12 border bg-white text-center text-xs font-semibold outline-none focus:ring-2 focus:ring-[#006096]/20',
                        metric.tone === 'danger' && 'border-[#ba1a1a] text-[#ba1a1a]',
                        metric.tone === 'warning' && 'border-[#f59e0b] text-[#92400e]',
                        !metric.tone && 'border-[#6b7280]',
                      )}
                      defaultValue={metric.value}
                    />
                  </span>
                  <span className="px-3 py-4 text-center text-[11px] text-[#6b7280]">{metric.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between border-t border-[#bfc7d2] bg-white px-6 py-4">
          <p className="max-w-[220px] text-xs leading-[18px] text-[#6b7280]">
            Đã nhập <strong className="text-[#006096]">14/38</strong> chỉ số - Chưa ký duyệt
          </p>
          <div className="flex gap-3">
            <button className={styles.secondaryButton} type="button">
              <Icon className="h-4 w-4" name="save" />
              Lưu nháp
            </button>
            <button className={styles.primaryButton} type="button">
              <Icon className="h-4 w-4" name="shield" />
              Xác nhận & Ký kết quả
            </button>
          </div>
        </div>
      </section>

      <aside className="bg-[#f8f9fe] p-6">
        <h2 className={styles.sectionTitle}>Tệp kết quả đính kèm</h2>
        <button className="mt-5 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#bfc7d2] bg-white p-10 text-center transition hover:border-[#006096] focus:outline-none focus:ring-4 focus:ring-[#006096]/10" type="button">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3f4f6] text-[#6b7280]">
            <Icon className="h-7 w-7" name="upload" />
          </span>
          <span className="text-[15px] font-bold text-[#111827]">Kéo thả hoặc click để tải lên</span>
          <span className="mt-1 text-xs text-[#9ca3af]">PDF, PNG, JPEG - Tối đa 10MB</span>
        </button>
        <div className="mt-6 flex h-[420px] flex-col items-center justify-center rounded-xl border border-[#bfc7d2] bg-white p-8 text-center shadow-sm">
          <Icon className="mb-5 h-16 w-16 text-[#9ca3af]/20" name="file" />
          <p className="text-sm text-[#9ca3af]">Chưa có tệp đính kèm</p>
          <p className="mt-1 text-[11px] text-[#9ca3af]">Tải lên phiếu kết quả từ máy xét nghiệm</p>
        </div>
      </aside>
    </div>
  );
}

function HistoryPageContent() {
  return (
    <div className="grid min-w-[1040px] grid-cols-[420px_minmax(0,1fr)]">
      <aside className="border-r border-[#e2e8f0] bg-white">
        <div className="border-b border-[#f1f5f9] px-5 py-5">
          <h2 className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#0ea5e9]">Tra cứu lịch sử</h2>
          <div className="mt-4 space-y-3">
            <SearchBox label="Tìm lịch sử xét nghiệm" placeholder="Tên, CCCD, mã bệnh án..." />
            <div className="grid grid-cols-2 gap-2">
              <button className="flex h-10 items-center justify-between rounded-lg bg-[#f8fafc] px-3 text-sm text-[#0f172a]" type="button">
                Tất cả loại XN <Icon className="h-4 w-4 text-[#64748b]" name="chevronRightSmall" />
              </button>
              <label className="relative">
                <span className="sr-only">Từ ngày</span>
                <input className="h-10 w-full rounded-lg bg-[#f8fafc] px-3 pr-9 text-xs outline-none" defaultValue="07/15/2025" />
                <Icon className="absolute right-3 top-3 h-4 w-4 text-[#94a3b8]" name="calendar" />
              </label>
            </div>
            <label className="relative block">
              <span className="absolute left-4 top-3 text-xs text-[#94a3b8]">Đến ngày</span>
              <input className="h-10 w-full rounded-lg bg-[#f8fafc] px-[86px] pr-10 text-xs outline-none" defaultValue="07/18/2025" />
              <Icon className="absolute right-3 top-3 h-4 w-4 text-[#94a3b8]" name="calendar" />
            </label>
          </div>
        </div>
        <div className="divide-y divide-[#f1f5f9]">
          {historyItems.map((item, index) => (
            <a
              className={cn('block px-5 py-4', index === 0 && 'border-l-4 border-[#0ea5e9] bg-[#eaf7ff]')}
              href="#result-detail"
              key={item.id}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold text-[#006096]">{item.id}</p>
                <p className="text-[11px] text-[#64748b]">{item.time}</p>
              </div>
              <p className="mt-2 text-base font-bold text-[#0f172a]">{item.patientName}</p>
              <p className="mt-1 text-xs text-[#64748b]">{item.meta}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-[#334155]">{item.testType}</span>
                <span className="text-[10px] text-[#94a3b8]">{item.technician}</span>
              </div>
            </a>
          ))}
        </div>
      </aside>

      <section className="p-6" id="result-detail">
        <div className="rounded-xl bg-[#0c4a6e] p-6 text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[1px] text-white/70">
                Phiếu xét nghiệm - PXN-2025-08397
              </p>
              <h2 className="mt-1 text-3xl font-bold leading-9">LÊ VĂN ĐỨC</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#ef4444] px-3 py-1.5 text-[10px] font-bold">
              <Icon className="h-3 w-3" name="shield" />
              ĐÃ KÝ
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-white/90">
            <span>48 tuổi - Nam</span>
            <span>BHYT: DN3010056781234</span>
            <span>Khoa Nội Da Liễu</span>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-[0.4px] text-[#64748b]">
              <tr>
                {['Chỉ số', 'Kết quả', 'Bình thường', 'Đơn vị', 'Đánh giá'].map((head) => (
                  <th className="px-6 py-4" key={head}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {signedResults.map((row) => {
                const isHigh = row.status === 'Cao';

                return (
                  <tr key={row.name}>
                    <td className="px-6 py-4 font-semibold text-[#334155]">{row.name}</td>
                    <td className={cn('px-6 py-4 font-bold', isHigh ? 'text-[#dc2626]' : 'text-[#16a34a]')}>
                      {row.value}
                    </td>
                    <td className="px-6 py-4 text-[#64748b]">{row.range}</td>
                    <td className="px-6 py-4 text-[#64748b]">{row.unit}</td>
                    <td className={cn('px-6 py-4 font-bold', isHigh ? 'text-[#dc2626]' : 'text-[#16a34a]')}>
                      {row.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className={cn(styles.card, 'p-6')}>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.6px] text-[#64748b]">
              <Icon className="h-4 w-4 text-[#0ea5e9]" name="shield" />
              Thông tin ký duyệt
            </h3>
            <div className="mt-4 flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#94a3b8]">
                <Icon className="h-5 w-5" name="shield" />
              </div>
              <div>
                <p className="font-bold text-[#0f172a]">BS. Trần Văn Bình</p>
                <p className="mt-1 text-xs leading-4 text-[#64748b]">
                  Đã ký bằng chữ ký số lúc 07:15 - 17/07/2025
                </p>
              </div>
            </div>
          </div>
          <div className={cn(styles.card, 'p-6')}>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.6px] text-[#64748b]">
              <Icon className="h-4 w-4 text-[#0ea5e9]" name="file" />
              Tệp đính kèm (02)
            </h3>
            <div className="mt-4 space-y-2">
              {['KQ_Hoa_Sinh_08397.pdf', 'Scan_BS_Yeu_Cau.jpg'].map((file) => (
                <div className="flex h-10 items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3" key={file}>
                  <Icon className="h-3.5 w-3.5 text-[#0ea5e9]" name="file" />
                  <span className="text-xs font-medium text-[#0f172a]">{file}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button className={styles.secondaryButton} type="button">
            <Icon className="h-4 w-4" name="download" />
            Tải tệp đính kèm
          </button>
          <button className={styles.primaryButton} type="button">
            <Icon className="h-4 w-4" name="printer" />
            In kết quả xét nghiệm
          </button>
        </div>
      </section>
    </div>
  );
}

function StatCardView({ card }: { card: StatCard }) {
  const tone = {
    blue: { bar: 'bg-[#006096]', icon: 'bg-[#e0f2fe] text-[#006096]', delta: 'text-[#16a34a]' },
    green: { bar: 'bg-[#22c55e]', icon: 'bg-[#f0fdf4] text-[#16a34a]', delta: 'text-[#dc2626]' },
    red: { bar: 'bg-[#ef4444]', icon: 'bg-[#fef2f2] text-[#ef4444]', delta: 'text-[#16a34a]' },
    teal: { bar: 'bg-[#14b8a6]', icon: 'bg-[#f0fdfa] text-[#14b8a6]', delta: 'text-[#16a34a]' },
  }[card.tone];

  return (
    <article className={cn(styles.card, 'relative overflow-hidden p-5')}>
      <div className={cn('absolute inset-x-0 top-0 h-1', tone.bar)} />
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tone.icon)}>
        <Icon className="h-5 w-5" name={card.icon} />
      </div>
      <p className="mt-5 flex items-baseline gap-1 text-3xl font-bold leading-9 text-[#0f172a]">
        {card.value}
        {card.unit ? <span className="text-sm font-medium text-[#64748b]">{card.unit}</span> : null}
      </p>
      <p className="mt-1 min-h-8 text-xs font-semibold leading-4 text-[#94a3b8]">{card.label}</p>
      <p className={cn('mt-2 flex items-center gap-1 text-[11px] font-bold', tone.delta)}>
        <Icon className="h-3 w-3" name="activity" />
        {card.delta}
      </p>
    </article>
  );
}

function ConfigPageContent() {
  const chartValues = [2, 1, 3, 6, 11, 15, 13, 11, 18, 15, 10, 7, 5, 4, 8, 13, 17, 11, 6, 4, 2, 1, 1];

  return (
    <div className="min-w-[1040px] p-6">
      <section className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold uppercase text-[#006096]">Thống kê hoạt động & cấu hình tham chiếu</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-[#f1f5f9] p-1">
            {['Hôm nay', 'Tuần này', 'Tháng này'].map((label, index) => (
              <button
                className={cn('rounded-md px-4 py-1.5 text-xs font-medium text-[#64748b]', index === 0 && 'bg-[#006096] font-bold text-white shadow-sm')}
                key={label}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <label className="relative">
            <span className="sr-only">Ngày thống kê</span>
            <input className="h-9 w-40 rounded-lg border border-[#e2e8f0] bg-white px-3 pr-10 text-xs font-medium outline-none" defaultValue="07/18/2025" />
            <Icon className="absolute right-3 top-2.5 h-4 w-4 text-[#94a3b8]" name="calendar" />
          </label>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCardView card={card} key={card.label} />
        ))}
      </section>

      <section className={cn(styles.card, 'mt-6 p-6')}>
        <h3 className="text-sm font-bold uppercase text-[#1e293b]">
          Phân bổ mẫu xét nghiệm theo giờ trong ngày <span className="ml-2 font-medium text-[#94a3b8]">- 18/07/2025</span>
        </h3>
        <div className="mt-8 grid h-[220px] grid-cols-[32px_1fr] gap-4">
          <div className="flex flex-col justify-between text-[10px] text-[#94a3b8]">
            {[21, 16, 11, 5, 0].map((tick) => <span key={tick}>{tick}</span>)}
          </div>
          <div className="relative flex items-end justify-between border-b border-[#e2e8f0]">
            <div className="absolute inset-x-0 top-0 h-px bg-[#e2e8f0]" />
            <div className="absolute inset-x-0 top-1/4 h-px bg-[#e2e8f0]" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-[#e2e8f0]" />
            <div className="absolute inset-x-0 top-3/4 h-px bg-[#e2e8f0]" />
            {chartValues.map((value, index) => (
              <div
                className="relative z-10 w-6 rounded-t bg-[linear-gradient(180deg,#0684c4_0%,#3d96c7_100%)]"
                key={`${value}-${index}`}
                style={{ height: `${Math.max(value * 9, 3)}px` }}
                title={`${index}h: ${value} mẫu`}
              />
            ))}
          </div>
        </div>
        <div className="ml-12 mt-3 flex justify-between text-[10px] text-[#64748b]">
          {['00h', '04h', '08h', '12h', '16h', '20h'].map((label) => <span key={label}>{label}</span>)}
        </div>
      </section>

      <section className={cn(styles.card, 'mt-6 overflow-hidden')}>
        <div className="flex items-center justify-between gap-4 border-b border-[#e2e8f0] px-6 py-5">
          <div>
            <h3 className="font-bold text-[#1e293b]">Bảng Trị Số Tham Chiếu Bình Thường</h3>
            <p className="mt-1 text-[11px] text-[#64748b]">
              Quản lý ngưỡng so sánh kết quả xét nghiệm - chỉ trưởng khoa mới được cập nhật
            </p>
          </div>
          <div className="flex gap-3">
            <SearchBox label="Tìm chỉ số tham chiếu" placeholder="Tìm chỉ số..." />
            <button className={styles.primaryButton} type="button">+ Cập nhật trị số</button>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-[0.4px] text-[#64748b]">
            <tr>
              {['Mã chỉ số', 'Tên xét nghiệm', 'Đơn vị', 'Ngưỡng dưới', 'Ngưỡng trên', 'Điều kiện', 'Thao tác'].map((head) => (
                <th className="px-6 py-4" key={head}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f8fafc]">
            {referenceRows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, index) => (
                  <td className={cn('px-6 py-4 text-xs', index < 2 && 'font-bold', index === 0 && 'text-[#006096]', index > 1 && 'text-[#475569]')} key={`${row[0]}-${cell}`}>
                    {index === 5 ? (
                      <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold', cell === 'Nữ' ? 'bg-[#fdf2f8] text-[#db2777]' : cell === 'Nam' ? 'bg-[#e0f2fe] text-[#006096]' : 'bg-[#f1f5f9] text-[#475569]')}>
                        {cell}
                      </span>
                    ) : cell}
                  </td>
                ))}
                <td className="px-6 py-4 text-xs font-bold text-[#006096] underline">Chỉnh sửa</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-[#f1f5f9] bg-[#f8fafc]/30 px-6 py-3">
          <p className="text-[11px] font-bold text-[#64748b]">Hiển thị 1 - 5 trên 38 chỉ số</p>
          <div className="flex gap-1">
            <button aria-label="Trang trước" className="flex h-7 w-7 items-center justify-center rounded border border-[#e2e8f0] bg-white opacity-50" type="button">
              <Icon className="h-4 w-4" name="chevronLeft" />
            </button>
            {[1, 2, 3].map((page) => (
              <button className={cn('h-7 w-7 rounded border border-[#e2e8f0] text-[11px] font-bold', page === 1 ? 'bg-[#006096] text-white' : 'bg-white text-[#64748b]')} key={page} type="button">
                {page}
              </button>
            ))}
            <button aria-label="Trang sau" className="flex h-7 w-7 items-center justify-center rounded border border-[#e2e8f0] bg-white" type="button">
              <Icon className="h-4 w-4" name="chevronRight" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function LabDashboardContent({ page }: { page: PageKind }) {
  if (page === 'result-entry') return <ResultEntryPageContent />;
  if (page === 'history') return <HistoryPageContent />;
  if (page === 'config') return <ConfigPageContent />;

  return <QueuePageContent />;
}

export function LabDashboardPage() {
  const [activePage, setActivePage] = useState<PageKind>('queue');

  return (
    <LabShell onChangePage={setActivePage} page={activePage}>
      <LabDashboardContent page={activePage} />
    </LabShell>
  );
}
