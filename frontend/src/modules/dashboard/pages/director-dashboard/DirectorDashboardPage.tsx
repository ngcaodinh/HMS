'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { LogoutButton } from '@/shared/auth/LogoutButton';
import { RoleIcon } from '@/shared/components/RoleIcon';
import { Sidebar as SharedSidebar } from '@/shared/components/sidebar/Sidebar';
import type { SidebarNavSectionConfig } from '@/shared/components/sidebar/sidebar.types';
import { useCurrentPrincipal } from '@/shared/hooks/use-current-principal';
import {
  useDirectorAuditSummary,
  useDirectorBedPerformance,
  useDirectorFinanceInsurance,
  useDirectorLabAnalytics,
  useDirectorOverview,
  useDirectorPharmacyInventory,
  type DirectorDashboardFilters,
} from '../../services/director-dashboard-api';
import type {
  DirectorAuditSummary,
  DirectorBedPerformance,
  DirectorDashboardPeriod,
  DirectorEnvelope,
  DirectorFinanceInsurance,
  DirectorLabAnalytics,
  DirectorOverview,
  DirectorPharmacyInventory,
} from '../../types/director-dashboard.schema';

type IconName =
  | 'activity'
  | 'alert'
  | 'bed'
  | 'chart'
  | 'clock'
  | 'download'
  | 'file'
  | 'flask'
  | 'home'
  | 'inventory'
  | 'logOut'
  | 'receipt'
  | 'shield'
  | 'users';

/** Các section read-only tương ứng với từng nhóm số liệu aggregate của Director. */
export type DirectorSection =
  | 'audit'
  | 'beds'
  | 'finance'
  | 'inventory'
  | 'lab'
  | 'overview';

/** Phần trạng thái tối thiểu mà QueryBoundary cần để render dữ liệu dashboard. */
type SectionQuery<T> = {
  data?: DirectorEnvelope<T>;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
};

/** Điều hướng nội bộ; việc hiển thị menu không thay thế authorization ở backend. */
const navSections = [
  {
    items: [
      {
        href: '/director/dashboard',
        icon: 'home',
        label: 'Tổng quan điều hành',
        section: 'overview',
      },
      {
        href: '/director/lab-analytics',
        icon: 'flask',
        label: 'Phân tích Xét nghiệm',
        section: 'lab',
      },
      {
        href: '/director/finance-insurance',
        icon: 'receipt',
        label: 'Tài chính & BHYT',
        section: 'finance',
      },
    ],
    title: 'Điều hành',
  },
  {
    items: [
      {
        href: '/director/bed-performance',
        icon: 'bed',
        label: 'Hiệu suất Giường bệnh',
        section: 'beds',
      },
      {
        href: '/director/pharmacy-inventory',
        icon: 'inventory',
        label: 'Dược phẩm & Tồn kho',
        section: 'inventory',
      },
      {
        href: '/director/audit-log',
        icon: 'shield',
        label: 'Nhật ký Kiểm toán',
        section: 'audit',
      },
    ],
    title: 'Vận hành',
  },
] as const;

/** Tiêu đề và mô tả nghiệp vụ của từng section, không phải dữ liệu từ API. */
const directorSectionMeta: Record<DirectorSection, { subtitle: string; title: string }> = {
  audit: {
    subtitle: 'Theo dõi truy cập, bypass và thao tác hệ thống nhạy cảm',
    title: 'Nhật ký Kiểm toán',
  },
  beds: {
    subtitle: 'Công suất sử dụng, giường trống và tải theo khoa',
    title: 'Hiệu suất Giường bệnh',
  },
  finance: {
    subtitle: 'Doanh thu thực thu, thanh toán và đối soát bảo hiểm y tế',
    title: 'Tài chính & BHYT',
  },
  inventory: {
    subtitle: 'Cảnh báo tồn kho thuốc, vật tư và hạn dùng',
    title: 'Dược phẩm & Tồn kho',
  },
  lab: {
    subtitle: 'Dữ liệu phân tích chuyên sâu các chỉ số phòng xét nghiệm',
    title: 'Phân tích Xét nghiệm',
  },
  overview: {
    subtitle: 'Tổng quan hoạt động bệnh viện theo kỳ điều hành',
    title: 'Tổng quan điều hành',
  },
};

/** Nhãn hiển thị cho đúng ba kỳ mà schema/API Director chấp nhận. */
const periodOptions: Array<{ label: string; value: DirectorDashboardPeriod }> = [
  { label: 'Hôm nay', value: 'today' },
  { label: '7 ngày', value: 'week' },
  { label: 'Tháng này', value: 'month' },
];

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Icon({ className = 'h-5 w-5', name }: { className?: string; name: IconName }) {
  const commonProps = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  };

  if (name === 'activity') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M4 13h4l2-7 4 12 2-5h4" />
      </svg>
    );
  }

  if (name === 'alert') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.3 4.5 2.7 18a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0Z" />
      </svg>
    );
  }

  if (name === 'bed') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M4 11V5" />
        <path d="M4 16v3" />
        <path d="M20 16v3" />
        <path d="M4 11h7a3 3 0 0 1 3 3v2" />
        <path d="M4 16h16v-3a2 2 0 0 0-2-2h-4" />
        <path d="M8 8h3" />
      </svg>
    );
  }

  if (name === 'chart') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 3-4 3 2 4-6" />
      </svg>
    );
  }

  if (name === 'clock') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </svg>
    );
  }

  if (name === 'download') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M12 4v10" />
        <path d="m8 10 4 4 4-4" />
        <path d="M5 20h14" />
      </svg>
    );
  }

  if (name === 'file') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
        <path d="M14 3v5h5" />
      </svg>
    );
  }

  if (name === 'flask') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" />
        <path d="M8 3h8" />
        <path d="M7 16h10" />
      </svg>
    );
  }

  if (name === 'home') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="m4 11 8-7 8 7" />
        <path d="M6 10v10h12V10" />
        <path d="M10 20v-5h4v5" />
      </svg>
    );
  }

  if (name === 'inventory') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M4 7h16" />
        <path d="M5 7l1 13h12l1-13" />
        <path d="M8 7V4h8v3" />
        <path d="M9 12h6" />
      </svg>
    );
  }

  if (name === 'logOut') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
        <path d="M14 8l4 4-4 4" />
        <path d="M18 12H9" />
      </svg>
    );
  }

  if (name === 'receipt') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1Z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    );
  }

  if (name === 'shield') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M12 3 5 6v6c0 4 2.8 7.4 7 9 4.2-1.6 7-5 7-9V6Z" />
        <path d="m9 12 2 2 4-5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...commonProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  );
}

/** Định dạng thời điểm cập nhật theo locale Việt Nam; giữ nguyên chuỗi nếu timestamp không hợp lệ. */
function formatOccurredAt(value?: string) {
  if (!value) return 'Đang đồng bộ';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
}

/**
 * Hiển thị điều hướng và thông tin phiên cho Director, kèm badge cảnh báo tồn kho aggregate.
 * @param activeSection Section đang được chọn để đánh dấu menu.
 * @param inventoryAlertCount Số cảnh báo tồn kho do API aggregate trả về; chỉ dùng để hiển thị badge.
 * @remarks Tên Director dùng trong lúc principal đang loading hoặc lỗi; logout là side effect do
 * `LogoutButton` thực hiện. Menu chỉ là UI boundary, còn authorization nằm ở backend.
 */
function DirectorSidebar({
  activeSection,
  inventoryAlertCount,
}: {
  activeSection: DirectorSection;
  inventoryAlertCount: number;
}) {
  const principalQuery = useCurrentPrincipal();
  const principal = principalQuery.data;

  const sections: SidebarNavSectionConfig[] = navSections.map((section) => ({
    id: section.title,
    label: section.title,
    items: section.items.map((item) => {
      const isActive = item.section === activeSection;
      const badge =
        item.section === 'inventory' && inventoryAlertCount > 0 ? String(inventoryAlertCount) : undefined;

      return {
        id: item.label,
        label: item.label,
        href: item.href,
        isActive,
        icon: (
          <Icon
            className={cn('h-5 w-5 shrink-0', isActive ? 'text-[#55d7ed]' : 'text-white/65')}
            name={item.icon}
          />
        ),
        badge: badge ? (
          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] leading-4 text-white">{badge}</span>
        ) : undefined,
      };
    }),
  }));

  return (
    <SharedSidebar
      footer={
        <>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#006096] text-sm font-bold text-white shadow transition-transform duration-200 hover:scale-105">
            <RoleIcon role="director" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-5 text-white">
              {principal?.fullName ?? 'Giám đốc'}
            </p>
            <p className="truncate text-[11px] font-medium leading-4 text-white/50">Giám đốc bệnh viện</p>
          </div>
          <LogoutButton
            ariaLabel="Đăng xuất"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/70 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            title="Đăng xuất"
          >
            <Icon className="h-4 w-4" name="logOut" />
          </LogoutButton>
        </>
      }
      navAriaLabel="Điều hướng giám đốc"
      sections={sections}
    />
  );
}

/** Hiển thị tiêu đề section và đồng hồ trạng thái hiện tại của workspace Director. */
function Header({ title }: { title: string }) {
  const [now, setNow] = useState(() => new Date());

  // Đồng bộ đồng hồ với timer của trình duyệt; effect chạy một lần và luôn dọn timer khi unmount.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="flex min-h-16 flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <h1 className="text-xl font-bold leading-7 text-sky-800">{title}</h1>
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-3 rounded-full border border-slate-100 bg-slate-50 px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
          <span className="text-xs leading-4 text-slate-600">
            {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(now)}
          </span>
        </div>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold leading-5 text-slate-400"
          disabled
          type="button"
        >
          <Icon className="h-4 w-4" name="download" />
          Xuất báo cáo
        </button>
      </div>
    </header>
  );
}

/**
 * Cho phép đổi kỳ tổng hợp và báo lựa chọn về page cha.
 * @param period Kỳ đang chọn để đánh dấu tab hiện tại.
 * @param onPeriodChange Callback nhận giá trị kỳ hợp lệ khi người dùng click tab.
 * @remarks Sự kiện click chỉ đổi state filter ở component cha; request GET và loading/error/success
 * được React Query xử lý ở section tương ứng.
 */
function PeriodTabs({
  period,
  onPeriodChange,
}: {
  onPeriodChange: (period: DirectorDashboardPeriod) => void;
  period: DirectorDashboardPeriod;
}) {
  return (
    <div className="inline-flex w-fit rounded-lg bg-slate-200 p-1">
      {periodOptions.map((option) => (
        <button
          className={cn(
            'rounded-md px-4 py-1.5 text-sm font-medium leading-5 transition focus:outline-none focus:ring-2 focus:ring-sky-700/20',
            option.value === period ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:bg-white/60',
          )}
          key={option.value}
          onClick={() => onPeriodChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Hiển thị ngữ cảnh section, kỳ dữ liệu và thời điểm aggregate gần nhất từ response metadata. */
function SectionIntro({
  meta,
  occurredAt,
  period,
}: {
  meta: { subtitle: string; title: string };
  occurredAt?: string;
  period: DirectorDashboardPeriod;
}) {
  const activePeriod = periodOptions.find((option) => option.value === period)?.label ?? 'Hôm nay';

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="text-2xl font-bold leading-8 text-slate-900">{meta.title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">{meta.subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs leading-4 text-slate-500">
        <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1">{activePeriod}</span>
        <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1">
          Cập nhật lúc {formatOccurredAt(occurredAt)}
        </span>
      </div>
    </div>
  );
}

/** Placeholder không chứa dữ liệu thật trong lúc section đang chờ response aggregate. */
function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-32 animate-pulse rounded-lg border border-slate-100 bg-white" key={index} />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg border border-slate-100 bg-white" />
    </div>
  );
}

/** Hiển thị lỗi HTTP hoặc lỗi parse contract ở boundary của một section dashboard. */
function ErrorState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Không tải được dữ liệu';

  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
      <span className="font-semibold">Không tải được dữ liệu.</span> {message}
    </div>
  );
}

/** Trạng thái rỗng dùng khi API thành công nhưng kỳ được chọn không có dòng dữ liệu. */
function EmptyState({ label = 'Chưa có dữ liệu cho kỳ này.' }: { label?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
      {label}
    </div>
  );
}

/**
 * Boundary chung cho từng query dashboard.
 * @param query Trạng thái React Query gồm loading, error, empty và envelope thành công.
 * @param children Callback render dữ liệu đã parse khi query thành công.
 * @returns Skeleton khi loading, lỗi khi request/parse thất bại, empty khi không có data hoặc
 * nội dung section khi response hợp lệ.
 * @remarks Boundary không retry hay mutate; retry/cache/cancellation thuộc adapter React Query.
 */
function QueryBoundary<T>({
  children,
  query,
}: {
  children: (envelope: DirectorEnvelope<T>) => ReactNode;
  query: SectionQuery<T>;
}) {
  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorState error={query.error} />;
  if (!query.data) return <EmptyState />;
  return <>{children(query.data)}</>;
}

/** Hiển thị các KPI aggregate dạng read-only và giữ trạng thái rỗng khi không có chỉ số. */
function SummaryCards({ cards }: { cards: DirectorOverview['kpis'] }) {
  if (!cards.length) return <EmptyState label="Chưa có chỉ số tổng hợp." />;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          className={cn(
            'rounded-lg border border-slate-100 bg-white p-5 shadow-sm',
            card.tone === 'red' && 'border-red-200',
            card.tone === 'amber' && 'border-amber-200',
          )}
          key={card.label}
        >
          <p className="text-xs font-bold uppercase leading-4 text-slate-500">{card.label}</p>
          <p
            className={cn(
              'mt-2 text-3xl font-bold leading-9 text-slate-900',
              card.tone === 'red' && 'text-red-600',
              card.tone === 'green' && 'text-green-700',
              card.tone === 'teal' && 'text-teal-700',
              card.tone === 'amber' && 'text-amber-700',
              card.tone === 'blue' && 'text-sky-700',
            )}
          >
            {card.value}
          </p>
          {card.detail ? <p className="mt-3 border-t border-slate-50 pt-3 text-xs text-slate-400">{card.detail}</p> : null}
        </article>
      ))}
    </div>
  );
}

/**
 * Hiển thị lưu lượng người bệnh theo giờ từ số đếm aggregate.
 * @param hourlyFlow Các điểm giờ/số lượng đã được backend tổng hợp, không chứa định danh người bệnh.
 * @remarks Biểu đồ chỉ trình bày dữ liệu đã parse; không thêm, sửa hoặc suy diễn KPI lâm sàng.
 */
function PatientFlowChart({ hourlyFlow }: { hourlyFlow: DirectorOverview['hourlyFlow'] }) {
  if (!hourlyFlow.length) return <EmptyState label="Chưa có lưu lượng bệnh nhân trong kỳ này." />;

  const maxValue = Math.max(...hourlyFlow.map((item) => item.value), 1);
  const step = hourlyFlow.length > 1 ? 600 / (hourlyFlow.length - 1) : 0;
  const points = hourlyFlow
    .map((item, index) => {
      const x = 40 + index * step;
      const y = 190 - (item.value / maxValue) * 150;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold leading-6 text-slate-800">Lưu lượng bệnh nhân theo giờ</h2>
      </div>
      <div className="mt-5 overflow-hidden">
        <svg className="h-56 w-full" role="img" viewBox="0 0 680 220" aria-label="Biểu đồ lưu lượng bệnh nhân theo giờ">
          {[40, 80, 120, 160, 200].map((y) => (
            <line key={y} stroke="#e2e8f0" strokeWidth="1" x1="40" x2="650" y1={y} y2={y} />
          ))}
          <polyline fill="none" points={points} stroke="#0369a1" strokeWidth="4" />
          {hourlyFlow.map((item, index) => {
            const x = 40 + index * step;
            const y = 190 - (item.value / maxValue) * 150;
            return (
              <g key={`${item.hour}-${index}`}>
                <circle cx={x} cy={y} fill="#0369a1" r="5" />
                <text fill="#64748b" fontSize="11" textAnchor="middle" x={x} y="214">
                  {item.hour}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

/** Hiển thị tỷ lệ phục vụ và các số đếm hàng đợi aggregate ở chế độ read-only. */
function QueueStatusCard({ metrics, servedRate }: { metrics: DirectorOverview['queueMetrics']; servedRate: number }) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold leading-6 text-slate-800">Trạng thái hàng đợi</h2>
      <div className="mt-8 flex justify-center">
        <div
          className="grid h-48 w-48 place-items-center rounded-full"
          style={{
            background: `conic-gradient(#0369a1 0 ${servedRate}%, #e2e8f0 ${servedRate}% 100%)`,
          }}
        >
          <div className="grid h-32 w-32 place-items-center rounded-full bg-white text-center">
            <div>
              <p className="text-3xl font-bold leading-9 text-slate-800">{servedRate}%</p>
              <p className="text-[10px] font-medium leading-4 text-slate-500">Đã phục vụ</p>
            </div>
          </div>
        </div>
      </div>
      <dl className="mt-8 space-y-3">
        {metrics.map((item) => (
          <div className="flex items-center justify-between gap-3" key={item.label}>
            <dt className="text-xs leading-4 text-slate-600">{item.label}</dt>
            <dd className="text-xs font-bold leading-4 text-slate-800">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Hiển thị số người đang chờ/đã hoàn tất theo khoa cùng status aggregate do backend cung cấp. */
function DepartmentTable({ rows }: { rows: DirectorOverview['departmentRows'] }) {
  if (!rows.length) return <EmptyState label="Chưa có phân bổ chuyên khoa trong kỳ này." />;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-50 p-6">
        <h2 className="text-base font-bold leading-6 text-slate-800">Phân bổ bệnh nhân theo chuyên khoa</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase leading-4 text-slate-500">
            <tr>
              <th className="px-6 py-4">Khoa / phòng</th>
              <th className="px-6 py-4">Đang chờ</th>
              <th className="px-6 py-4">Hoàn tất</th>
              <th className="px-6 py-4">Tổng</th>
              <th className="px-6 py-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => (
              <tr key={row.departmentName}>
                <td className="px-6 py-4 text-sm font-semibold leading-5 text-slate-800">{row.departmentName}</td>
                <td className="px-6 py-4 text-sm font-bold leading-5 text-slate-900">{row.waiting}</td>
                <td className="px-6 py-4 text-sm leading-5 text-slate-600">{row.completed}</td>
                <td className="px-6 py-4 text-sm leading-5 text-slate-600">{row.total}</td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-4',
                      row.status === 'busy' && 'bg-amber-100 text-amber-800',
                      row.status === 'normal' && 'bg-green-100 text-green-800',
                      row.status === 'critical' && 'bg-red-100 text-red-800',
                    )}
                  >
                    {row.statusLabel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Hiển thị các tỷ lệ aggregate dạng thanh tiến độ, với trạng thái rỗng cho kỳ không có dữ liệu. */
function ProgressRows({ rows, title }: { rows: Array<{ label: string; value: number }>; title: string }) {
  if (!rows.length) return <EmptyState label="Chưa có dữ liệu tỷ lệ cho kỳ này." />;

  return (
    <section className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-base font-bold leading-6 text-slate-800">{title}</h3>
      <div className="mt-5 space-y-4">
        {rows.map((row) => {
          const width = Math.max(0, Math.min(100, row.value));
          return (
            <div className="space-y-1.5" key={row.label}>
              <div className="flex items-center justify-between gap-4 text-xs leading-4">
                <span className="font-medium text-slate-600">{row.label}</span>
                <span className="font-bold text-slate-800">{row.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-sky-700" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Bảng read-only cho các dòng aggregate đã được backend chuyển thành chuỗi hiển thị. */
function DataTable({
  columns,
  rows,
  title,
}: {
  columns: string[];
  rows: Array<{ cells: string[] }>;
  title: string;
}) {
  if (!rows.length) return <EmptyState label="Chưa có dòng dữ liệu cho kỳ này." />;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <h3 className="text-base font-bold leading-6 text-slate-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase leading-4 text-slate-500">
            <tr>
              {columns.map((column) => (
                <th className="px-6 py-4" key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row, rowIndex) => (
              <tr key={`${row.cells.join('-')}-${rowIndex}`}>
                {row.cells.map((cell, cellIndex) => (
                  <td
                    className={cn(
                      'px-6 py-4 text-sm leading-5',
                      cellIndex === 0 ? 'font-semibold text-slate-800' : 'text-slate-600',
                    )}
                    key={`${cell}-${cellIndex}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Hiển thị ma trận AMR aggregate; các giá trị chỉ là trạng thái xét nghiệm, không phải hồ sơ bệnh nhân. */
function AmrHeatmap({ data }: { data: DirectorLabAnalytics['amrHeatmap'] }) {
  if (!data.rows.length) return <EmptyState label="Chưa có dữ liệu kháng sinh đồ trong kỳ này." />;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <h3 className="text-base font-bold leading-6 text-slate-800">Bản đồ Kháng sinh đồ</h3>
      </div>
      <div className="overflow-x-auto p-6">
        <table className="w-full min-w-[520px] text-center text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-3 text-left">Chủng vi khuẩn</th>
              {data.antibiotics.map((item) => (
                <th className="px-3 py-3" key={item}>{item}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.rows.map((row, rowIndex) => (
              <tr key={`${row.organism}-${rowIndex}`}>
                <td className="px-3 py-3 text-left font-medium text-slate-800">{row.organism}</td>
                {row.values.map((value, valueIndex) => (
                  <td
                    className={cn(
                      'px-3 py-3 font-bold',
                      value === 'R' && 'bg-red-50 text-red-700',
                      value === 'I' && 'bg-amber-50 text-amber-700',
                      value === 'S' && 'bg-green-50 text-green-700',
                    )}
                    key={`${value}-${valueIndex}`}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Ghép section tổng quan điều hành từ endpoint aggregate `overview`.
 * @param filters Bộ lọc kỳ/ngày hiện tại của page.
 * @param onPeriodChange Callback từ tab kỳ, cập nhật filter local để React Query fetch lại dữ liệu.
 * @remarks QueryBoundary hiển thị loading/error/empty/success; response chỉ gồm KPI, hàng đợi,
 * lưu lượng và phân bổ khoa/phòng đã redacted.
 */
function OverviewContent({
  filters,
  onPeriodChange,
}: {
  filters: DirectorDashboardFilters;
  onPeriodChange: (period: DirectorDashboardPeriod) => void;
}) {
  const query = useDirectorOverview(filters);

  return (
    <QueryBoundary query={query}>
      {(envelope) => (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <SectionIntro
              meta={directorSectionMeta.overview}
              occurredAt={envelope.meta?.occurredAt}
              period={filters.period}
            />
            <PeriodTabs period={filters.period} onPeriodChange={onPeriodChange} />
          </div>
          <SummaryCards cards={envelope.data.kpis} />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <PatientFlowChart hourlyFlow={envelope.data.hourlyFlow} />
            <QueueStatusCard metrics={envelope.data.queueMetrics} servedRate={envelope.data.queueServedRate} />
          </div>
          <DepartmentTable rows={envelope.data.departmentRows} />
        </>
      )}
    </QueryBoundary>
  );
}

/**
 * Ghép section phân tích xét nghiệm từ endpoint aggregate `lab-analytics`.
 * @param filters Bộ lọc kỳ/ngày dùng cho query.
 * @remarks QueryBoundary xử lý loading/error/empty/success; UI không expose hồ sơ hay định danh
 * người bệnh và không thay đổi kết quả xét nghiệm.
 */
function LabAnalyticsContent({ filters }: { filters: DirectorDashboardFilters }) {
  const query = useDirectorLabAnalytics(filters);

  return (
    <QueryBoundary query={query}>
      {(envelope) => (
        <>
          <SectionIntro meta={directorSectionMeta.lab} occurredAt={envelope.meta?.occurredAt} period={filters.period} />
          <SummaryCards cards={envelope.data.summaryCards} />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1fr)]">
            <ProgressRows rows={envelope.data.topAbnormalIndicators} title="Chỉ số hóa sinh bất thường cao" />
            <ProgressRows rows={envelope.data.resultByStatus} title="Tỷ lệ trạng thái xét nghiệm" />
          </div>
          <AmrHeatmap data={envelope.data.amrHeatmap} />
        </>
      )}
    </QueryBoundary>
  );
}

/**
 * Ghép section tài chính/BHYT read-only từ endpoint aggregate `finance-insurance`.
 * @param filters Bộ lọc kỳ/ngày dùng cho query.
 * @remarks QueryBoundary xử lý loading/error/empty/success; các giá trị tiền/trạng thái được hiển
 * thị từ backend, frontend không tự tính lại hay mutate dữ liệu.
 */
function FinanceContent({ filters }: { filters: DirectorDashboardFilters }) {
  const query = useDirectorFinanceInsurance(filters);

  return (
    <QueryBoundary query={query}>
      {(envelope) => (
        <>
          <SectionIntro
            meta={directorSectionMeta.finance}
            occurredAt={envelope.meta?.occurredAt}
            period={filters.period}
          />
          <SummaryCards cards={envelope.data.summaryCards} />
          <DataTable
            columns={['Nguồn thu', 'Sản lượng', 'Giá trị / trạng thái', 'Phạm vi']}
            rows={envelope.data.reconciliationRows}
            title="Đối soát tài chính & bảo hiểm y tế"
          />
        </>
      )}
    </QueryBoundary>
  );
}

/**
 * Ghép section hiệu suất giường theo khoa/phòng từ endpoint aggregate `bed-performance`.
 * @param filters Bộ lọc kỳ/ngày dùng cho query.
 * @remarks QueryBoundary xử lý loading/error/empty/success; dữ liệu không chứa danh sách người bệnh
 * đang nằm và chỉ được trình bày read-only.
 */
function BedPerformanceContent({ filters }: { filters: DirectorDashboardFilters }) {
  const query = useDirectorBedPerformance(filters);

  return (
    <QueryBoundary query={query}>
      {(envelope) => (
        <>
          <SectionIntro meta={directorSectionMeta.beds} occurredAt={envelope.meta?.occurredAt} period={filters.period} />
          <SummaryCards cards={envelope.data.summaryCards} />
          <DataTable
            columns={['Khoa / khu điều trị', 'Đang sử dụng', 'Công suất', 'Trạng thái']}
            rows={envelope.data.departmentRows}
            title="Hiệu suất giường bệnh theo khoa"
          />
        </>
      )}
    </QueryBoundary>
  );
}

/**
 * Ghép section dược phẩm/tồn kho từ endpoint aggregate `pharmacy-inventory`.
 * @param filters Bộ lọc kỳ/ngày dùng cho query.
 * @remarks QueryBoundary xử lý loading/error/empty/success; `alertCount` của cùng query được dùng
 * độc lập cho badge điều hướng ở page cha.
 */
function InventoryContent({ filters }: { filters: DirectorDashboardFilters }) {
  const query = useDirectorPharmacyInventory(filters);

  return (
    <QueryBoundary query={query}>
      {(envelope) => (
        <>
          <SectionIntro
            meta={directorSectionMeta.inventory}
            occurredAt={envelope.meta?.occurredAt}
            period={filters.period}
          />
          <SummaryCards cards={envelope.data.summaryCards} />
          <DataTable
            columns={['Thuốc / vật tư', 'Kho', 'Tồn khả dụng', 'Cảnh báo']}
            rows={envelope.data.rows}
            title="Dược phẩm & tồn kho cần chú ý"
          />
        </>
      )}
    </QueryBoundary>
  );
}

/**
 * Ghép section audit aggregate từ endpoint `audit-summary` theo action/resource/role.
 * @param filters Bộ lọc kỳ/ngày dùng cho query.
 * @remarks QueryBoundary xử lý loading/error/empty/success; section không render log dòng chi tiết,
 * username hoặc PII.
 */
function AuditContent({ filters }: { filters: DirectorDashboardFilters }) {
  const query = useDirectorAuditSummary(filters);

  return (
    <QueryBoundary query={query}>
      {(envelope) => (
        <>
          <SectionIntro meta={directorSectionMeta.audit} occurredAt={envelope.meta?.occurredAt} period={filters.period} />
          <SummaryCards cards={envelope.data.summaryCards} />
          <DataTable
            columns={['Nhóm sự kiện', 'Số lượng', 'Trạng thái', 'Phạm vi hiển thị']}
            rows={envelope.data.actionRows}
            title="Tổng hợp kiểm toán điều hành"
          />
          <div className="grid gap-6 xl:grid-cols-2">
            <DataTable
              columns={['Resource', 'Số lượng', 'Nhóm', 'Phạm vi']}
              rows={envelope.data.resourceRows}
              title="Audit theo tài nguyên"
            />
            <DataTable
              columns={['Role', 'Số lượng', 'Nhóm', 'Ẩn danh']}
              rows={envelope.data.roleRows}
              title="Audit theo vai trò"
            />
          </div>
        </>
      )}
    </QueryBoundary>
  );
}

/**
 * Chọn nội dung theo section đang active và giữ callback đổi kỳ cho section tổng quan.
 * @param filters Bộ lọc local được truyền xuống section tương ứng.
 * @param onPeriodChange Callback cập nhật kỳ từ PeriodTabs của overview.
 * @param section Section được chọn từ route/menu.
 * @remarks Mỗi section tự sở hữu query và QueryBoundary, nên loading/error/empty của một endpoint
 * không làm thay đổi dữ liệu aggregate của section khác.
 */
function DirectorContent({
  filters,
  onPeriodChange,
  section,
}: {
  filters: DirectorDashboardFilters;
  onPeriodChange: (period: DirectorDashboardPeriod) => void;
  section: DirectorSection;
}) {
  if (section === 'lab') return <LabAnalyticsContent filters={filters} />;
  if (section === 'finance') return <FinanceContent filters={filters} />;
  if (section === 'beds') return <BedPerformanceContent filters={filters} />;
  if (section === 'inventory') return <InventoryContent filters={filters} />;
  if (section === 'audit') return <AuditContent filters={filters} />;
  return <OverviewContent filters={filters} onPeriodChange={onPeriodChange} />;
}

function DirectorFooter() {
  return (
    <footer className="border-t border-slate-200 py-3 text-right text-[10px] leading-4 text-slate-400">
      © 2026 HMS-VN Solution. All rights reserved.
    </footer>
  );
}

/**
 * Hiển thị dashboard điều hành read-only theo section và kỳ dữ liệu được chọn.
 * @param section Section khởi tạo, mặc định là `overview`; dùng để chọn nội dung và menu đang active.
 * @returns Workspace gồm sidebar, tiêu đề, KPI/biểu đồ/bảng aggregate và trạng thái footer.
 * @remarks State local chỉ giữ `period`; dữ liệu lấy qua các hook React Query từ `/director-dashboard/*`.
 * Mỗi section render loading, error, empty hoặc success qua QueryBoundary; badge tồn kho dùng query
 * aggregate riêng ở page. UI không hiển thị PII và không thay đổi nghiệp vụ, payload hay số liệu backend.
 * UI visibility không thay thế authorization: backend vẫn kiểm tra quyền `director.dashboard.read`
 * và audit cho từng request.
 */
export function DirectorDashboardPage({ section = 'overview' }: { section?: DirectorSection }) {
  const [period, setPeriod] = useState<DirectorDashboardPeriod>('today');
  const filters: DirectorDashboardFilters = { period };
  const meta = directorSectionMeta[section];
  const inventoryQuery = useDirectorPharmacyInventory(filters);
  const inventoryAlertCount = inventoryQuery.data?.data.alertCount ?? 0;

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 md:flex">
      <DirectorSidebar activeSection={section} inventoryAlertCount={inventoryAlertCount} />
      <div className="min-w-0 flex-1">
        <Header title={meta.title} />
        <div className="space-y-6 p-5 lg:p-8">
          <DirectorContent filters={filters} onPeriodChange={setPeriod} section={section} />
          <DirectorFooter />
        </div>
      </div>
    </main>
  );
}
