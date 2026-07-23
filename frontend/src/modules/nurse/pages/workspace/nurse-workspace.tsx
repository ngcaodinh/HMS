'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import {
  beds,
  careOrders,
  navItems,
  queuePatients,
  sampleOrders,
  screenMeta,
  vitalFields,
  vitalStats,
  type Bed,
  type CareOrder,
  type IconName,
  type NurseScreen,
  type StatCard,
  type VitalField,
} from './nurse-workspace.data';
import { nurseWorkspaceStyles as styles } from './nurse-workspace.styles';
function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Icon({ className = 'h-4 w-4', name }: { className?: string; name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    activity: <path d="M3 12h3l2-7 4 14 2-7h7" />,
    alert: <path d="M12 3 2.8 20h18.4L12 3Zm0 6v4m0 3h.01" />,
    bed: <path d="M3 7v11m0-4h18m0 4V9a3 3 0 0 0-3-3h-7v8M7 10h2" />,
    calendar: <path d="M7 3v3m10-3v3M4 9h16M5 5h14v16H5z" />,
    check: <path d="m5 12 4 4L19 6" />,
    clipboard: <path d="M9 4h6l1 2h3v15H5V6h3l1-2Zm0 7h6m-6 4h4" />,
    file: <path d="M7 3h7l5 5v13H7zM14 3v6h5" />,
    flask: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3" />,
    heart: (
      <path d="M20 8.5c0 5-8 10.5-8 10.5S4 13.5 4 8.5A4.5 4.5 0 0 1 12 5a4.5 4.5 0 0 1 8 3.5Z" />
    ),
    logOut: <path d="M10 17 15 12l-5-5m5 5H3m8-9h8v18h-8" />,
    refresh: (
      <path d="M20 6v5h-5M4 18v-5h5M18 11a6 6 0 0 0-10-4.5L4 10m2 3a6 6 0 0 0 10 4.5l4-3.5" />
    ),
    search: <path d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />,
    shield: <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />,
    syringe: <path d="m18 2 4 4M17 7l-8.5 8.5L5 12l8.5-8.5L17 7Zm-7 7 3 3m-9 2 5-5" />,
    user: <path d="M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

function Sidebar({
  activeScreen,
  onChangeScreen,
}: {
  activeScreen: NurseScreen;
  onChangeScreen: (screen: NurseScreen) => void;
}) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logoMark}>
          <Image
            alt="HMS-VN"
            className="h-full w-full object-cover"
            height={36}
            priority
            src="/hms-login-logo.png"
            width={36}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-5 text-white">HMS-VN Clinical</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase leading-4 tracking-[0.4px] text-white/50">
            Hệ thống quản lý bệnh viện
          </p>
        </div>
      </div>

      <nav aria-label="Màn hình làm việc" className={styles.nav}>
        <p className={styles.navSection}>Màn hình làm việc</p>
        {navItems.map((item) => {
          const active = activeScreen === item.id;

          return (
            <button
              aria-current={active ? 'page' : undefined}
              className={cn(styles.navItem, active && styles.navItemActive)}
              key={item.id}
              onClick={() => onChangeScreen(item.id)}
              type="button"
            >
              <Icon
                className={cn('h-5 w-5 shrink-0', active ? 'text-[#22d3ee]' : 'text-white/70')}
                name={item.icon}
              />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    styles.badge,
                    item.id === 'samples' ? 'bg-[#006096]' : 'bg-[#b91c1c]',
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.logoMark}>
          <Icon className="h-5 w-5 text-white" name="user" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-5 text-white">Nguyễn Thị Hương</p>
          <p className="text-xs font-medium leading-4 text-white/50">Điều dưỡng</p>
        </div>
        <button aria-label="Đăng xuất" className={styles.iconButton} type="button">
          <Icon name="logOut" />
        </button>
      </div>
    </aside>
  );
}

function Topbar({ activeScreen }: { activeScreen: NurseScreen }) {
  const meta = screenMeta[activeScreen];

  return (
    <header className={styles.topbar}>
      <div className="min-w-0">
        <h1 className={cn('truncate text-lg font-bold leading-7 text-[#0369a1]', meta.titleClass)}>
          {meta.title}
        </h1>
        <p className="truncate text-xs font-medium leading-4 text-[#64748b]">{meta.subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={styles.shortcut}>F2 Gọi tiếp</span>
        <span className={styles.shortcut}>F9 Lưu</span>
      </div>
    </header>
  );
}

function StatGrid({ stats }: { stats: StatCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article className={styles.statCard} key={stat.label}>
          <div className="flex items-center gap-4">
            <div className={cn(styles.statIcon, stat.iconClass)}>
              <Icon className="h-5 w-5" name={stat.icon} />
            </div>
            <div className="min-w-0">
              <p className={cn('text-2xl font-bold leading-6 text-[#1e293b]', stat.valueClass)}>
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium uppercase leading-4 text-[#64748b]">
                {stat.label}
              </p>
              {stat.delta && (
                <p className="mt-1 text-xs font-bold leading-4 text-[#22c55e]">{stat.delta}</p>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function Card({
  children,
  count,
  icon,
  title,
}: {
  children: ReactNode;
  count?: string;
  icon: IconName;
  title: string;
}) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          <Icon className="h-4 w-4 text-[#0369a1]" name={icon} />
          {title}
        </h2>
        {count && <span className="text-xs font-medium leading-4 text-[#64748b]">{count}</span>}
      </div>
      {children}
    </section>
  );
}

function PatientQueue() {
  return (
    <Card count="7 ca" icon="clipboard" title="Hàng đợi chờ đo sinh hiệu">
      <div className="flex flex-wrap gap-2 p-3">
        <button className={cn(styles.primaryButton, 'h-16 px-4 text-sm')} type="button">
          <Icon name="heart" />
          Gọi số tiếp theo
          <span className="rounded-sm bg-white/20 px-1.5 py-0.5 text-[10px]">F2</span>
        </button>
        <button className={cn(styles.secondaryButton, 'h-16 text-[#006096]')} type="button">
          <Icon name="refresh" />
          Gọi lại
        </button>
      </div>
      <div className="px-3 pb-3">
        <label className="relative block">
          <span className="sr-only">Tìm bệnh nhân trong hàng đợi</span>
          <Icon
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]"
            name="search"
          />
          <input className={cn(styles.input, 'pl-9')} placeholder="Tìm theo họ tên, SĐT, CCCD..." />
        </label>
      </div>
      <div className="max-h-96 overflow-auto border-t border-[#cbd5e1]">
        {queuePatients.map((patient) => {
          const calling = patient.status === 'calling';

          return (
            <button
              className={cn(
                'flex w-full items-center gap-3 border-b border-[#cbd5e1] p-4 text-left transition hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#006096]/20',
                calling && 'border-l-4 border-l-[#006096] bg-[#e0f2fe]',
              )}
              key={patient.id}
              type="button"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[#006096] text-sm font-bold text-white">
                {patient.number}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block truncate text-xs font-bold uppercase leading-5',
                    calling ? 'text-[#006096]' : 'text-[#334155]',
                  )}
                >
                  {patient.name}
                </span>
                <span className="block truncate text-xs font-medium leading-4 text-[#64748b]">
                  {patient.meta}
                </span>
              </span>
              <span
                className={cn(
                  'rounded-sm px-2 py-1 text-[10px] font-bold uppercase leading-4',
                  calling ? 'bg-red-100 text-[#b91c1c]' : 'bg-blue-50 text-[#006096]',
                )}
              >
                {calling ? 'Đang gọi' : 'Đợi đo'}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function VitalInput({ field }: { field: VitalField }) {
  return (
    <label>
      <span className={styles.label}>{field.label}</span>
      {field.unit ? (
        <span className="flex">
          <input className={cn(styles.input, 'rounded-r-none')} defaultValue={field.value} />
          <span className={styles.fieldUnit}>{field.unit}</span>
        </span>
      ) : (
        <input className={styles.input} defaultValue={field.value} />
      )}
    </label>
  );
}

function VitalsForm() {
  return (
    <Card icon="heart" title="Chỉ số sinh tồn (Vital signs)">
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vitalFields.map((field) => (
            <VitalInput field={field} key={field.label} />
          ))}
          <label>
            <span className={styles.label}>Chỉ số BMI (tự tính)</span>
            <div className="flex h-10 items-center rounded-lg border border-[#cbd5e1] bg-[#f1f5f9] px-4 text-sm font-bold text-[#475569]">
              -
            </div>
          </label>
        </div>

        <div>
          <p className={styles.label}>Tiền sử dị ứng</p>
          <div className="rounded-xl border-2 border-[#b91c1c]/20 bg-red-50/30 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <button
                aria-pressed="true"
                className="relative h-6 w-12 rounded-full bg-[#b91c1c] shadow-inner focus:outline-none focus:ring-4 focus:ring-[#b91c1c]/20"
                type="button"
              >
                <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-5 text-[#b91c1c]">
                  Có dị ứng thuốc / thức ăn
                </p>
                <p className="text-xs font-medium leading-4 text-[#b91c1c]/70">
                  Bật để nhập chi tiết chất dị ứng
                </p>
              </div>
              <Icon className="h-6 w-6 text-[#b91c1c]" name="alert" />
            </div>
            <textarea
              className={cn(styles.textarea, 'mt-4 border-[#b91c1c]/40')}
              placeholder="Nhập mô tả chi tiết: tên thuốc, loại thức ăn gây dị ứng và biểu hiện dị ứng... Ví dụ: Penicillin → nổi mề đay toàn thân"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-3 rounded-b-xl border-t border-[#cbd5e1] bg-[#f8fafc] p-4">
        <button className={styles.secondaryButton} type="button">
          Hủy
        </button>
        <button className={cn(styles.primaryButton, 'px-8 text-sm')} type="button">
          <Icon name="check" />
          Lưu kết quả (F9)
        </button>
      </div>
    </Card>
  );
}

function VitalsScreen() {
  return (
    <div className="space-y-6">
      <StatGrid stats={vitalStats} />
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <PatientQueue />
        <VitalsForm />
      </div>
    </div>
  );
}

function SamplesScreen() {
  const stats: StatCard[] = [
    { value: '12', label: 'Chờ lấy mẫu', icon: 'flask', iconClass: 'bg-blue-100 text-[#006096]' },
    { value: '8', label: 'Đã lấy mẫu', icon: 'check', iconClass: 'bg-green-100 text-[#15803d]' },
    {
      value: '4',
      label: 'Chờ bàn giao lab',
      icon: 'file',
      iconClass: 'bg-teal-100 text-[#0f766e]',
    },
    {
      value: '1',
      label: 'Mẫu cấp cứu ưu tiên',
      icon: 'alert',
      iconClass: 'bg-red-100 text-[#b91c1c]',
    },
  ];

  return (
    <div className="space-y-5">
      <StatGrid stats={stats} />
      <section className={cn(styles.card, 'overflow-hidden')}>
        <div className="flex border-b border-[#cbd5e1] bg-[#f8fafc]">
          <button
            className="border-b-2 border-[#006096] px-6 py-3 text-sm font-medium text-[#006096]"
            type="button"
          >
            1. Lấy mẫu bệnh phẩm
          </button>
          <button className="px-6 py-3 text-sm font-medium text-[#64748b]" type="button">
            2. Phiếu bàn giao mẫu (Phòng Lab)
          </button>
        </div>
        <div className="grid min-h-[620px] lg:grid-cols-[288px_minmax(0,1fr)]">
          <aside className="border-r border-[#cbd5e1]">
            <div className="flex gap-2 border-b border-[#cbd5e1] bg-[#f8fafc] p-3">
              <select className={cn(styles.input, 'h-9 text-xs')}>
                <option>Khoa Da Liễu</option>
              </select>
              <label className="relative">
                <span className="sr-only">Tìm bệnh nhân</span>
                <Icon
                  className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]"
                  name="search"
                />
                <input
                  className={cn(styles.input, 'h-9 pl-8 text-xs')}
                  placeholder="Tên bệnh nhân..."
                />
              </label>
            </div>
            <p className="bg-[#f8fafc]/70 px-4 py-2 text-xs font-bold uppercase leading-4 tracking-[0.4px] text-[#64748b]">
              Bệnh nhân chờ lấy mẫu
            </p>
            {queuePatients.slice(0, 3).map((patient, index) => (
              <button
                className={cn(
                  'flex w-full items-center gap-3 border-b border-[#f1f5f9] p-4 text-left',
                  index === 0 && 'border-l-4 border-l-[#006096] bg-indigo-50',
                )}
                key={patient.id}
                type="button"
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-sm text-sm font-bold text-white',
                    index === 1 ? 'bg-green-600' : 'bg-[#006096]',
                  )}
                >
                  {patient.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold uppercase text-[#1f2937]">
                    {patient.name}
                  </span>
                  <span className="block text-xs text-[#64748b]">
                    {index === 0 ? 'Nam, 42t • Giường 101-A' : patient.meta}
                  </span>
                  <span className="block text-xs text-[#64748b]">
                    {index === 0 ? '1/2 mẫu bệnh phẩm' : '1/1 mẫu bệnh phẩm'}
                  </span>
                </span>
              </button>
            ))}
          </aside>
          <div className="min-w-0">
            <div className="flex flex-wrap justify-between gap-3 border-b border-[#cbd5e1] p-4">
              <div>
                <h2 className="text-lg font-bold leading-7 text-[#1f2937]">NGUYỄN VĂN A</h2>
                <p className="text-xs leading-5 text-[#64748b]">
                  Tuổi: 42 • Giới tính: Nam • Buồng 101 – Giường 101-A
                </p>
              </div>
              <div className="text-left lg:text-right">
                <p className="text-xs font-medium leading-4 text-[#64748b]">Chẩn đoán:</p>
                <p className="text-xs font-bold leading-5 text-[#475569]">
                  Viêm da tiếp xúc dị ứng mạn tính – Giai đoạn bùng phát
                </p>
              </div>
            </div>
            <div className="space-y-4 p-4">
              {sampleOrders.map((order) => (
                <article
                  className="overflow-hidden rounded-lg border border-[#cbd5e1] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  key={order.code}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cbd5e1] bg-[#f8fafc] px-4 py-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-sm bg-[#e5e7eb] px-2 py-0.5 text-xs font-bold text-[#475569]">
                        {order.code}
                      </span>
                      <span className="text-xs font-bold uppercase text-[#0f766e]">
                        {order.type}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-bold uppercase',
                        order.status === 'done'
                          ? 'rounded-sm bg-green-100 px-2 py-0.5 text-[#15803d]'
                          : 'text-[#475569]',
                      )}
                    >
                      {order.status === 'done' ? 'Đã lấy mẫu' : 'Chờ lấy mẫu'}
                    </span>
                  </div>
                  <div className="space-y-2 px-4 py-4">
                    <h3 className="text-base font-bold leading-6 text-[#006096]">{order.order}</h3>
                    <p className="text-xs leading-5 text-[#64748b]">
                      Thời điểm lấy:{' '}
                      <strong className="text-[#334155]">{order.time ?? 'Chưa thực hiện'}</strong>
                    </p>
                    <div className="flex flex-wrap justify-end gap-3 pt-3">
                      <button className={styles.primaryButton} type="button">
                        In mã vạch (Barcode)
                      </button>
                      <button
                        className={
                          order.status === 'done' ? styles.secondaryButton : styles.primaryButton
                        }
                        type="button"
                      >
                        {order.status === 'done' ? 'Đã lấy thành công' : 'Tiến hành lấy mẫu'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function BedCard({ bed }: { bed: Bed }) {
  if (bed.status === 'empty') {
    return (
      <article className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-[#cbd5e1] bg-white p-6 text-center shadow-sm">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#e5e7eb] text-[#cbd5e1]">
          <Icon name="bed" />
        </div>
        <p className="mb-4 text-xs font-medium text-[#94a3b8]">Giường trống</p>
        <button className={styles.primaryButton} type="button">
          Tiếp nhận bệnh nhân
        </button>
      </article>
    );
  }

  const tone =
    bed.status === 'emergency'
      ? 'border-[#b91c1c] shadow-md'
      : bed.status === 'discharge'
        ? 'border-[#22c55e]'
        : 'border-[#006096]';
  const dotClass =
    bed.status === 'emergency'
      ? 'bg-[#b91c1c]'
      : bed.status === 'discharge'
        ? 'bg-[#22c55e]'
        : 'bg-[#006096]';

  return (
    <article className={cn('overflow-hidden rounded-xl border bg-white shadow-sm', tone)}>
      <div className="flex items-center justify-between gap-2 border-b border-[#f1f5f9] p-3">
        <p className="text-xs font-bold leading-5 text-[#18181b]">Giường {bed.bed}</p>
        <div className="flex items-center gap-2">
          {bed.allergy && (
            <span className="rounded-sm bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#b91c1c]">
              Dị ứng
            </span>
          )}
          {bed.status === 'emergency' && (
            <span className="rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
              Cấp cứu
            </span>
          )}
          {bed.status === 'discharge' && (
            <span className="rounded-sm bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#15803d]">
              Chờ xuất viện
            </span>
          )}
          <span className={cn('h-2 w-2 rounded-full', dotClass)} />
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-sm font-bold uppercase leading-5 text-[#18181b]">{bed.patient}</h3>
        <p className="text-xs leading-4 text-[#64748b]">{bed.meta}</p>
        <p className="min-h-8 text-xs leading-4 text-[#374151]">{bed.diagnosis}</p>
        <p className="flex items-center gap-1 text-xs font-semibold leading-4 text-[#006096]">
          <Icon className="h-3.5 w-3.5" name="user" />
          BS. Điều trị phụ trách
        </p>
      </div>
      <div className="flex flex-wrap gap-1 border-t border-[#f1f5f9] bg-[#f8fafc] p-2">
        <button className={cn(styles.secondaryButton, 'h-8 px-2 text-[10px]')} type="button">
          Chuyển
        </button>
        <button className={cn(styles.secondaryButton, 'h-8 px-2 text-[10px]')} type="button">
          Bệnh án
        </button>
        <button
          className={cn(
            bed.status === 'discharge'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'opacity-50',
            styles.secondaryButton,
            'h-8 px-2 text-[10px]',
          )}
          type="button"
        >
          {bed.status === 'discharge' ? 'Hoàn tất' : 'Xuất'}
        </button>
      </div>
    </article>
  );
}

function BedsScreen() {
  const stats: StatCard[] = [
    { value: '24', label: 'Tổng số giường', icon: 'bed', iconClass: 'bg-indigo-50 text-[#006096]' },
    {
      value: '18',
      label: 'Đang sử dụng (75%)',
      icon: 'activity',
      iconClass: 'bg-yellow-50 text-[#ea580c]',
    },
    {
      value: '6',
      label: 'Giường trống',
      icon: 'check',
      iconClass: 'bg-sky-100 text-[#15803d]',
      valueClass: 'text-[#15803d]',
    },
    {
      value: '3',
      label: 'Chờ xuất viện',
      icon: 'file',
      iconClass: 'bg-slate-100 text-[#475569]',
      valueClass: 'text-[#0284c7]',
    },
  ];

  return (
    <div className="space-y-6">
      <StatGrid stats={stats} />
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <select className={cn(styles.input, 'w-36')}>
            <option>Tất cả buồng</option>
          </select>
          <select className={cn(styles.input, 'w-40')}>
            <option>Tất cả trạng thái</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {[
            ['bg-[#cbd5e1]', 'Trống'],
            ['bg-[#006096]', 'Đang dùng'],
            ['bg-[#b91c1c]', 'Cấp cứu'],
            ['bg-[#22c55e]', 'Chờ xuất viện'],
          ].map(([color, label]) => (
            <span
              className="inline-flex items-center gap-2 text-xs font-medium text-[#64748b]"
              key={label}
            >
              <span className={cn('h-2.5 w-2.5 rounded-full', color)} />
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[1px] text-[#94a3b8]">
            Buồng 101
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {beds.slice(0, 4).map((bed) => (
              <BedCard bed={bed} key={bed.bed} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[1px] text-[#94a3b8]">
            Buồng 102
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {beds.slice(4).map((bed) => (
              <BedCard bed={bed} key={bed.bed} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function OrderStatus({ status }: { status: CareOrder['status'] }) {
  if (status === 'done') {
    return (
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
          <Icon className="h-4 w-4" name="check" />
        </span>
        <span>
          <span className="block text-xs font-bold text-[#15803d]">Đã thực hiện 07:12</span>
          <span className="block text-[10px] font-medium text-[#64748b]">
            Bởi ĐD Nguyễn Thị Hương
          </span>
        </span>
      </div>
    );
  }

  if (status === 'blocked') {
    return (
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-400 px-4 text-xs font-bold text-white opacity-80"
        type="button"
      >
        <Icon name="shield" />
        Bị khóa – Dị ứng
      </button>
    );
  }

  if (status === 'delayed') {
    return (
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-200 bg-orange-100 text-orange-600">
          <Icon name="refresh" />
        </span>
        <span>
          <span className="block text-xs font-bold text-orange-700">
            Đã hoãn – Bệnh nhân đi chụp
          </span>
          <span className="block text-[10px] font-medium text-orange-600">X-quang chưa về</span>
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="flex items-start gap-2 text-xs font-semibold leading-4 text-[#475569]">
        <input className="mt-0.5 h-4 w-4 rounded border-[#cbd5e1]" type="checkbox" />
        Đã test da – Kết quả: ÂM TÍNH
      </label>
      <button className={styles.primaryButton} type="button">
        Xác nhận thực hiện
      </button>
      <button className={styles.secondaryButton} type="button">
        Báo hoãn
      </button>
    </div>
  );
}

function OrdersScreen() {
  const stats: StatCard[] = [
    {
      value: '8',
      label: 'Chờ thực hiện',
      icon: 'activity',
      iconClass: 'bg-orange-50 text-[#ea580c]',
      valueClass: 'text-orange-700',
    },
    {
      value: '14',
      label: 'Đã thực hiện hôm nay',
      icon: 'check',
      iconClass: 'bg-green-50 text-[#16a34a]',
      valueClass: 'text-green-700',
    },
    {
      value: '2',
      label: 'Đã hoãn / sự cố',
      icon: 'alert',
      iconClass: 'bg-red-50 text-[#dc2626]',
      valueClass: 'text-red-700',
    },
    {
      value: '1',
      label: 'Cảnh báo dị ứng thuốc',
      icon: 'shield',
      iconClass: 'bg-red-100 text-[#dc2626]',
      valueClass: 'text-red-700',
    },
  ];

  return (
    <div className="space-y-6">
      <StatGrid stats={stats} />
      <section className={cn(styles.card, 'overflow-hidden')}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <Icon className="h-4 w-4 text-[#006096]" name="clipboard" />
            Danh sách y lệnh & Kế hoạch chăm sóc trong ngày
          </h2>
        </div>
        <div className="flex flex-wrap gap-3 border-b border-[#f1f5f9] bg-[#f8fafc]/60 p-4">
          <select className={cn(styles.input, 'w-36 text-xs')}>
            <option>Tất cả buồng</option>
          </select>
          <select className={cn(styles.input, 'w-28 text-xs')}>
            <option>Tất cả ca</option>
          </select>
          <select className={cn(styles.input, 'w-32 text-xs')}>
            <option>Tất cả loại</option>
          </select>
          <label className="relative min-w-[240px] flex-1">
            <span className="sr-only">Tìm y lệnh</span>
            <Icon
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]"
              name="search"
            />
            <input
              className={cn(styles.input, 'pl-9 text-xs')}
              placeholder="Tìm tên thuốc, bệnh nhân..."
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse">
            <thead>
              <tr>
                <th className={styles.th}>Giờ</th>
                <th className={styles.th}>Bệnh nhân</th>
                <th className={styles.th}>Nội dung y lệnh</th>
                <th className={styles.th}>Lưu ý đặc biệt</th>
                <th className={cn(styles.th, 'text-center')}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {careOrders.map((order) => (
                <tr
                  className={cn(order.status === 'blocked' && 'bg-red-50/30')}
                  key={`${order.time}-${order.title}`}
                >
                  <td className={styles.td}>
                    <p
                      className={cn(
                        'text-base font-bold',
                        order.status === 'pending' ? 'text-[#006096]' : 'text-[#334155]',
                      )}
                    >
                      {order.time}
                    </p>
                    {order.status === 'pending' && (
                      <span className="mt-1 inline-flex rounded-sm bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase leading-3 text-white">
                        Đã quá giờ
                      </span>
                    )}
                  </td>
                  <td className={styles.td}>
                    <p className="text-sm font-bold uppercase leading-5 text-[#1e293b]">
                      {order.patient}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#64748b]">{order.room}</p>
                  </td>
                  <td className={styles.td}>
                    {order.status === 'pending' && (
                      <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold uppercase leading-4 text-red-700">
                        Yêu cầu thử phản ứng da trước khi tiêm
                      </div>
                    )}
                    {order.status === 'blocked' && (
                      <div className="mb-2 rounded-lg border border-red-700 bg-red-600 p-3 text-xs font-bold uppercase leading-4 text-white">
                        Cảnh báo dị ứng thuốc nghiêm trọng
                      </div>
                    )}
                    <p
                      className={cn(
                        'text-sm font-bold leading-5',
                        order.status === 'blocked' ? 'text-red-700' : 'text-[#1e293b]',
                      )}
                    >
                      {order.title}
                    </p>
                    <span className="mt-1 inline-flex rounded-sm bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      「ĐÃ KÝ」 BS. T.V.Khoa
                    </span>
                    <p className="mt-1 text-xs font-medium text-[#475569]">{order.instruction}</p>
                  </td>
                  <td className={styles.td}>
                    <p
                      className={cn(
                        'text-xs leading-4',
                        order.status === 'blocked' ? 'font-bold text-red-600' : 'text-[#64748b]',
                      )}
                    >
                      {order.note}
                    </p>
                  </td>
                  <td className={cn(styles.td, 'min-w-56')}>
                    <OrderStatus status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#e2e8f0] bg-[#f8fafc] px-4 py-5 text-center text-xs font-medium uppercase tracking-[0.6px] text-[#94a3b8]">
          Đang tải thêm dữ liệu...
        </div>
      </section>
    </div>
  );
}

function EmergencyScreen() {
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center gap-4 rounded-xl border border-[#b91c1c] bg-rose-200 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[#b91c1c]">
          <Icon className="h-6 w-6" name="shield" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2 text-red-800">
            <span className="text-3xl font-bold leading-9">2</span>
            <span className="text-sm font-bold">ca vô danh cấp cứu</span>
          </p>
          <p className="text-xs font-medium leading-4 text-red-800">
            Cần chuẩn hóa danh tính trước khi xuất viện / đóng hồ sơ
          </p>
        </div>
        <p className="text-xs leading-5 text-red-800/80">
          <strong>Theo dõi:</strong> NĐ 13/2023/NĐ-CP
          <br />
          Bảo vệ dữ liệu cá nhân y tế
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card count="2 ca" icon="alert" title="Bệnh nhân vô danh chưa xác định">
          <div className="divide-y divide-[#f1f5f9]">
            {['Vô danh Nam – Cấp Cứu', 'Vô danh Nữ – Cấp Cứu'].map((name, index) => (
              <button
                className={cn(
                  'flex w-full gap-3 p-4 text-left',
                  index === 0 ? 'border-l-4 border-l-[#b91c1c] bg-red-700/5' : 'opacity-70',
                )}
                key={name}
                type="button"
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    index === 0 ? 'bg-rose-200 text-[#b91c1c]' : 'bg-gray-100 text-gray-400',
                  )}
                >
                  <Icon name="user" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold leading-4 text-gray-900">{name}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#64748b]">
                    STT 0{index + 1} • Giường {index === 0 ? '101-D' : '102-C'} • Buồng Cấp cứu
                  </span>
                  <span
                    className={cn(
                      'mt-1 block text-[10px] font-bold leading-5',
                      index === 0 ? 'text-[#b91c1c]' : 'text-gray-400',
                    )}
                  >
                    Vào viện: {index === 0 ? '17/07/2026 – 03:42 sáng' : '16/07/2026 – 22:15 tối'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        <section className={cn(styles.card, 'overflow-hidden')}>
          <div className="border-b border-red-700/20 bg-red-50 px-5 py-3">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase leading-4 text-[#b91c1c]">
              <Icon name="file" />
              Biểu mẫu chuẩn hóa danh tính – STT 01
            </h2>
          </div>
          <div className="space-y-6 p-6">
            <div className="rounded-lg border-l-4 border-gray-300 bg-gray-50 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500">
                Thông tin tạm thời (đọc thêm)
              </p>
              <p className="text-xs leading-4 text-gray-900">
                Tên tạm: <strong>Vô danh Nam – Cấp Cứu</strong>
              </p>
              <p className="mt-1 text-xs leading-4 text-gray-600">
                Lý do cấp cứu: Phản ứng dị ứng nghiêm trọng, khó thở, nổi mề đay toàn thân. Bypass
                thủ tục hành chính khẩn cấp lúc 03:42.
              </p>
            </div>
            <p className="inline-flex items-center gap-2 rounded-sm border border-blue-100 bg-sky-50 px-3 py-2 text-xs font-bold uppercase leading-4 text-[#006096]">
              <Icon name="user" />
              Thông tin thực tế chính thức
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Họ và tên thật" required value="NHẬP HỌ TÊN (TỰ CHUYỂN HOA CÓ DẤU)" />
              <Field label="Ngày sinh" required value="mm/dd/yyyy" />
              <div>
                <span className={styles.label}>
                  Giới tính <span className="text-[#b91c1c]">*</span>
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="flex h-11 items-center gap-2 rounded-md border border-[#006096] bg-sky-50 px-4 text-sm font-medium text-[#18181b]"
                    type="button"
                  >
                    <span className="h-4 w-4 rounded-full border border-[#006096] bg-[#006096] p-1">
                      <span className="block h-full w-full rounded-full bg-white" />
                    </span>
                    Nam
                  </button>
                  <button
                    className="flex h-11 items-center gap-2 rounded-md border border-[#d1d5db] bg-white px-4 text-sm font-medium text-[#18181b]"
                    type="button"
                  >
                    <span className="h-4 w-4 rounded-full border border-gray-500" />
                    Nữ
                  </button>
                </div>
              </div>
              <Field label="Số điện thoại di động VN" required value="0901234567" />
              <Field label="Số CCCD (12 chữ số)" required value="001234567890" />
              <Field
                label="Địa chỉ thường trú / tạm trú"
                value="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              />
              <Field label="Mã thẻ BHYT (nếu có)" value="DN3501234567890" />
              <Field label="Họ tên người bảo hộ / liên hệ" required value="Họ và tên người thân" />
            </div>
            <label className="flex items-start gap-3 rounded-sm border border-gray-200 bg-gray-50 p-3 text-xs leading-4 text-gray-600">
              <input className="mt-0.5 h-4 w-4 rounded border-gray-500" type="checkbox" />
              <span>
                Xác nhận bệnh nhân/người nhà đã đồng ý cung cấp thông tin và ký bản cam kết bảo mật
                theo
                <strong> Nghị định 13/2023/NĐ-CP</strong> về bảo vệ dữ liệu cá nhân y tế.
              </span>
            </label>
            <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-6">
              <button className={styles.secondaryButton} type="button">
                Làm mới
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#b91c1c] px-8 text-sm font-bold text-white shadow-[0_4px_6px_rgba(186,26,26,0.2)]"
                type="button"
              >
                <Icon name="shield" />
                Xác nhận chuẩn hóa danh tính
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  value,
}: {
  label: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label>
      <span className={styles.label}>
        {label} {required && <span className="text-[#b91c1c]">*</span>}
      </span>
      <input className={styles.input} defaultValue={value} />
    </label>
  );
}

function ActiveScreen({ activeScreen }: { activeScreen: NurseScreen }) {
  if (activeScreen === 'samples') return <SamplesScreen />;
  if (activeScreen === 'beds') return <BedsScreen />;
  if (activeScreen === 'orders') return <OrdersScreen />;
  if (activeScreen === 'emergency') return <EmergencyScreen />;

  return <VitalsScreen />;
}

export function NurseWorkspacePage() {
  const [activeScreen, setActiveScreen] = useState<NurseScreen>('vitals');
  const footerYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <main className={styles.shell}>
      <Sidebar activeScreen={activeScreen} onChangeScreen={setActiveScreen} />
      <section className={styles.workspace}>
        <Topbar activeScreen={activeScreen} />
        <div className={styles.content}>
          <ActiveScreen activeScreen={activeScreen} />
        </div>
        <footer className={styles.footer}>
          © {footerYear} HMS-VN Solution. All rights reserved.
        </footer>
      </section>
    </main>
  );
}
