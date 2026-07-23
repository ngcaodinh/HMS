import Link from 'next/link';

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

export type DirectorSection =
  | 'audit'
  | 'beds'
  | 'finance'
  | 'inventory'
  | 'lab'
  | 'overview';

type KpiTone = 'blue' | 'green' | 'red' | 'teal';
type QueueTone = 'blue' | 'cyan' | 'green' | 'slate';
type DepartmentStatus = 'busy' | 'normal' | 'critical';

type KpiCard = {
  accentClass: string;
  delta: string;
  deltaClass: string;
  detail: string;
  icon: IconName;
  iconClass: string;
  label: string;
  tone: KpiTone;
  value: string;
};

type QueueMetric = {
  label: string;
  tone: QueueTone;
  value: string;
};

type DepartmentRow = {
  doctor: string;
  done: string;
  name: string;
  status: DepartmentStatus;
  statusLabel: string;
  waiting: string;
  waitTime: string;
};

const navSections = [
  {
    items: [
      {
        badge: undefined,
        href: '/director/dashboard',
        icon: 'home',
        label: 'Tổng quan điều hành',
        section: 'overview',
      },
      {
        badge: undefined,
        href: '/director/lab-analytics',
        icon: 'flask',
        label: 'Phân tích Xét nghiệm',
        section: 'lab',
      },
      {
        badge: undefined,
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
        badge: undefined,
        href: '/director/bed-performance',
        icon: 'bed',
        label: 'Hiệu suất Giường bệnh',
        section: 'beds',
      },
      {
        badge: '3',
        href: '/director/pharmacy-inventory',
        icon: 'inventory',
        label: 'Dược phẩm & Tồn kho',
        section: 'inventory',
      },
      {
        badge: undefined,
        href: '/director/audit-log',
        icon: 'shield',
        label: 'Nhật ký Kiểm toán',
        section: 'audit',
      },
    ],
    title: 'Vận hành',
  },
] as const;

const directorSectionMeta: Record<
  DirectorSection,
  {
    subtitle: string;
    title: string;
  }
> = {
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
    subtitle: 'Tổng quan hoạt động bệnh viện trong ngày',
    title: 'Tổng quan điều hành',
  },
};

const kpiCards: KpiCard[] = [
  {
    accentClass: 'bg-sky-700',
    delta: '↑ 8.2%',
    deltaClass: 'bg-green-50 text-green-700',
    detail: 'So hôm qua: 1,153 lượt',
    icon: 'users',
    iconClass: 'bg-blue-50 text-sky-700',
    label: 'Lượt khám & Tiếp đón',
    tone: 'blue',
    value: '1,248',
  },
  {
    accentClass: 'bg-teal-600',
    delta: 'Cao',
    deltaClass: 'bg-amber-50 text-amber-700',
    detail: '437 / 500 giường đang sử dụng',
    icon: 'bed',
    iconClass: 'bg-teal-50 text-teal-700',
    label: 'Công suất giường bệnh',
    tone: 'teal',
    value: '87.5%',
  },
  {
    accentClass: 'bg-green-600',
    delta: '↑ 12.4%',
    deltaClass: 'bg-green-50 text-green-700',
    detail: 'Tiền mặt: 198M · Momo: 122,5M',
    icon: 'receipt',
    iconClass: 'bg-green-50 text-green-700',
    label: 'Doanh thu ngày (VNĐ)',
    tone: 'green',
    value: '320,5M',
  },
  {
    accentClass: 'bg-red-600',
    delta: '2 bypass',
    deltaClass: 'bg-red-50 text-red-700 uppercase',
    detail: '2 ca bypass hành chính cần chuẩn hóa',
    icon: 'alert',
    iconClass: 'bg-red-50 text-red-700',
    label: 'Ca cấp cứu đang xử trí',
    tone: 'red',
    value: '18',
  },
];

const queueMetrics: QueueMetric[] = [
  { label: 'Đang chờ', tone: 'blue', value: '25' },
  { label: 'Đã gọi', tone: 'cyan', value: '5' },
  { label: 'Đã phục vụ', tone: 'green', value: '1,220' },
  { label: 'TG chờ TB', tone: 'slate', value: "4.5'" },
];

const departmentRows: DepartmentRow[] = [
  {
    doctor: 'BS. Nguyễn Thị Lan',
    done: '148',
    name: 'Phòng khám Da liễu 1',
    status: 'busy',
    statusLabel: 'Đông',
    waiting: '12',
    waitTime: "6.2'",
  },
  {
    doctor: 'BS. Trần Quốc Huy',
    done: '132',
    name: 'Phòng khám Da liễu 2',
    status: 'normal',
    statusLabel: 'Bình thường',
    waiting: '8',
    waitTime: "4.8'",
  },
  {
    doctor: 'BS. Phạm Minh Tuấn',
    done: '97',
    name: 'Phòng Dị ứng miễn dịch',
    status: 'normal',
    statusLabel: 'Bình thường',
    waiting: '3',
    waitTime: "3.1'",
  },
  {
    doctor: 'BS. Lê Thị Mai',
    done: '88',
    name: 'Phòng Thẩm mỹ lâm sàng',
    status: 'normal',
    statusLabel: 'Bình thường',
    waiting: '2',
    waitTime: "2.4'",
  },
  {
    doctor: 'BS. Võ Minh Khoa',
    done: '18',
    name: 'Khoa Cấp cứu',
    status: 'critical',
    statusLabel: '18 ca cấp cứu',
    waiting: '0',
    waitTime: '-',
  },
];

const hourlyFlow = [
  { hour: '7h', value: 48 },
  { hour: '8h', value: 82 },
  { hour: '9h', value: 118 },
  { hour: '10h', value: 126 },
  { hour: '11h', value: 142 },
  { hour: '12h', value: 96 },
  { hour: '13h', value: 109 },
  { hour: '14h', value: 74 },
  { hour: '15h', value: 92 },
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

function DirectorSidebar({ activeSection }: { activeSection: DirectorSection }) {
  return (
    <aside className="flex min-h-screen w-full shrink-0 flex-col bg-slate-900 text-white md:w-64">
      <div className="flex items-center gap-3 border-b border-white/10 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-700 text-sm font-black text-white">
          HMS
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-5">HMS-VN</p>
          <p className="text-xs leading-4 text-white/60">Bệnh viện Da liễu</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-4" aria-label="Điều hướng giám đốc">
        {navSections.map((section) => (
          <div className="space-y-2" key={section.title}>
            <p className="px-3 text-[10px] font-bold uppercase leading-4 text-white/40">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = item.section === activeSection;

                return (
                  <Link
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium leading-5 transition',
                      isActive
                        ? 'border-l-4 border-cyan-400 bg-white/15 pl-2 text-white shadow-sm'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                    )}
                    href={item.href}
                    key={item.label}
                  >
                    <Icon
                      className={cn('h-5 w-5', isActive ? 'text-cyan-300' : 'text-white/60')}
                      name={item.icon}
                    />
                    <span className="min-w-0 flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] leading-4 text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 bg-black/20 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-700 to-cyan-400 text-sm font-bold">
            MQ
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-5">Trần Minh Quân</p>
            <p className="truncate text-xs leading-4 text-white/50">Giám đốc bệnh viện</p>
          </div>
          <button
            aria-label="Đăng xuất"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            type="button"
          >
            <Icon className="h-4 w-4" name="logOut" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function Header({ title }: { title: string }) {
  return (
    <header className="flex min-h-16 flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <h1 className="text-xl font-bold leading-7 text-sky-800">{title}</h1>
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-3 rounded-full border border-slate-100 bg-slate-50 px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
          <span className="text-xs leading-4 text-slate-600">14:24:14 20/07/2026</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold leading-4 text-amber-800">
          <Icon className="h-4 w-4" name="alert" />
          2 ca bypass chưa chuẩn hóa
        </div>
        <button
          aria-label="Mở nhật ký cảnh báo"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
          type="button"
        >
          <Icon className="h-5 w-5" name="clock" />
        </button>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold leading-5 text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
          type="button"
        >
          <Icon className="h-4 w-4" name="download" />
          Xuất báo cáo
        </button>
      </div>
    </header>
  );
}

function KpiGrid() {
  return (
    <section className="grid gap-4 xl:grid-cols-4" aria-label="Chỉ số điều hành chính">
      {kpiCards.map((card) => (
        <article
          className={cn(
            'relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm',
            card.tone === 'red' ? 'border-red-200' : 'border-slate-100',
          )}
          key={card.label}
        >
          <div className={cn('absolute left-0 top-0 h-1 w-full', card.accentClass)} />
          <div className="flex items-start justify-between gap-4">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', card.iconClass)}>
              <Icon className="h-6 w-6" name={card.icon} />
            </div>
            <span className={cn('rounded-full px-2 py-1 text-[10px] font-bold leading-4', card.deltaClass)}>
              {card.delta}
            </span>
          </div>
          <p className={cn('mt-4 text-3xl font-bold leading-9', card.tone === 'red' ? 'text-red-600' : 'text-slate-900')}>
            {card.value}
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-500">{card.label}</p>
          <div className={cn('mt-4 border-t pt-3 text-xs leading-4', card.tone === 'red' ? 'border-red-50 text-red-500' : 'border-slate-50 text-slate-400')}>
            {card.detail}
          </div>
        </article>
      ))}
    </section>
  );
}

function PatientFlowChart() {
  const points = hourlyFlow
    .map((item, index) => {
      const x = 40 + index * 75;
      const y = 180 - item.value;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold leading-6 text-slate-800">Lưu lượng bệnh nhân theo giờ</h2>
        <span className="rounded bg-blue-50 px-2 py-1 text-xs font-bold uppercase leading-4 text-blue-700">
          Hôm nay - 20/07/2026
        </span>
      </div>

      <div className="mt-5 overflow-hidden">
        <svg
          className="h-56 w-full"
          role="img"
          viewBox="0 0 680 220"
          aria-label="Biểu đồ lưu lượng bệnh nhân theo giờ, đỉnh 142 lượt lúc 11h"
        >
          {[40, 80, 120, 160, 200].map((y) => (
            <line key={y} stroke="#e2e8f0" strokeWidth="1" x1="40" x2="650" y1={y} y2={y} />
          ))}
          <defs>
            <linearGradient id="patient-flow-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon fill="url(#patient-flow-gradient)" points={`40,200 ${points} 640,200`} />
          <polyline fill="none" points={points} stroke="#0369a1" strokeWidth="4" />
          {hourlyFlow.map((item, index) => {
            const x = 40 + index * 75;
            const y = 180 - item.value;

            return (
              <g key={item.hour}>
                <circle cx={x} cy={y} fill="#0369a1" r="4" stroke="white" strokeWidth="2" />
                <text fill="#94a3b8" fontSize="11" textAnchor="middle" x={x} y="214">
                  {item.hour}
                </text>
              </g>
            );
          })}
          <g>
            <rect fill="#0369a1" height="24" rx="3" width="78" x="330" y="24" />
            <text fill="white" fontSize="12" fontWeight="700" x="340" y="40">
              Đỉnh: 142
            </text>
          </g>
        </svg>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {queueMetrics.map((metric) => (
          <div
            className={cn(
              'rounded-r-lg border-l-4 bg-slate-50 p-3',
              metric.tone === 'blue' && 'border-sky-700',
              metric.tone === 'cyan' && 'border-sky-500',
              metric.tone === 'green' && 'border-green-600',
              metric.tone === 'slate' && 'border-slate-400',
            )}
            key={metric.label}
          >
            <p className="text-xl font-bold leading-7 text-slate-800">{metric.value}</p>
            <p className="text-xs font-medium leading-4 text-slate-500">{metric.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function QueueStatusCard() {
  const legendItems = [
    { color: 'bg-sky-700', label: 'Đã phục vụ', value: '1,220' },
    { color: 'bg-amber-400', label: 'Đang chờ', value: '25' },
    { color: 'bg-blue-400', label: 'Đã gọi', value: '5' },
    { color: 'bg-slate-400', label: 'Bỏ qua', value: '3' },
  ];

  return (
    <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold leading-6 text-slate-800">Trạng thái hàng đợi</h2>
      <div className="mt-8 flex justify-center">
        <div
          className="grid h-48 w-48 place-items-center rounded-full"
          style={{
            background: 'conic-gradient(#0369a1 0 84%, #fbbf24 84% 94%, #60a5fa 94% 98%, #94a3b8 98% 100%)',
          }}
        >
          <div className="grid h-32 w-32 place-items-center rounded-full bg-white text-center">
            <div>
              <p className="text-3xl font-bold leading-9 text-slate-800">97.6%</p>
              <p className="text-[10px] font-medium leading-4 text-slate-500">Đã phục vụ</p>
            </div>
          </div>
        </div>
      </div>
      <dl className="mt-8 space-y-3">
        {legendItems.map((item) => (
          <div className="flex items-center justify-between gap-3" key={item.label}>
            <dt className="flex items-center gap-2 text-xs leading-4 text-slate-600">
              <span className={cn('h-2.5 w-2.5 rounded-sm', item.color)} />
              {item.label}
            </dt>
            <dd className="text-xs font-bold leading-4 text-slate-800">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function DepartmentTable() {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 p-6">
        <h2 className="text-base font-bold leading-6 text-slate-800">
          Phân bổ bệnh nhân theo chuyên khoa
        </h2>
        <div className="flex items-center gap-1 text-xs leading-4 text-slate-400">
          <Icon className="h-3.5 w-3.5" name="clock" />
          Cập nhật lúc 15:42:08
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[880px] w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase leading-4 text-slate-500">
            <tr>
              <th className="px-6 py-4">Phòng / chuyên khoa</th>
              <th className="px-6 py-4">Bác sĩ trực</th>
              <th className="px-6 py-4">Đang chờ</th>
              <th className="px-6 py-4">Đã khám</th>
              <th className="px-6 py-4">TG chờ TB</th>
              <th className="px-6 py-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {departmentRows.map((row) => (
              <tr key={row.name}>
                <td className="px-6 py-4 text-sm font-semibold leading-5 text-slate-800">{row.name}</td>
                <td className="px-6 py-4 text-sm leading-5 text-slate-600">{row.doctor}</td>
                <td className="px-6 py-4 text-sm font-bold leading-5 text-slate-900">{row.waiting}</td>
                <td className="px-6 py-4 text-sm leading-5 text-slate-600">{row.done}</td>
                <td className="px-6 py-4 text-sm leading-5 text-slate-600">{row.waitTime}</td>
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

function OverviewContent() {
  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-8 text-slate-800">
            Tổng quan hoạt động bệnh viện
          </h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            Dữ liệu điều hành tổng hợp, không drill-down thông tin cá nhân.
          </p>
        </div>
        <PeriodTabs />
      </div>

      <KpiGrid />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <PatientFlowChart />
        <QueueStatusCard />
      </div>

      <DepartmentTable />
    </>
  );
}

function PeriodTabs() {
  return (
    <div className="inline-flex w-fit rounded-lg bg-slate-200 p-1">
      {['Hôm nay', '7 ngày', 'Tháng này'].map((label, index) => (
        <button
          className={cn(
            'rounded-md px-4 py-1.5 text-sm font-medium leading-5 transition focus:outline-none focus:ring-2 focus:ring-sky-700/20',
            index === 0 ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:bg-white/60',
          )}
          key={label}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function SummaryCards({
  cards,
}: {
  cards: Array<{ accent: string; label: string; value: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          className={cn(
            'rounded-xl border border-slate-100 bg-white p-5 shadow-sm',
            'border-l-4',
            card.accent,
          )}
          key={card.label}
        >
          <p className="text-xs font-bold uppercase leading-4 text-slate-500">{card.label}</p>
          <p className="mt-2 text-3xl font-bold leading-9 text-slate-900">{card.value}</p>
        </article>
      ))}
    </div>
  );
}

function ProgressRows({
  rows,
  title,
}: {
  rows: Array<{ color: string; label: string; value: number }>;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-base font-bold leading-6 text-slate-800">{title}</h3>
      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <div className="space-y-1.5" key={row.label}>
            <div className="flex items-center justify-between gap-4 text-xs leading-4">
              <span className="font-medium text-slate-600">{row.label}</span>
              <span className="font-bold text-slate-800">{row.value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={cn('h-full rounded-full', row.color)} style={{ width: `${row.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LabAnalyticsContent() {
  const cards = [
    { accent: 'border-l-sky-500', label: 'Tổng chỉ định CLS', value: '2,847' },
    { accent: 'border-l-emerald-500', label: 'Đã có kết quả', value: '2,614' },
    { accent: 'border-l-rose-500', label: 'Chờ kết quả', value: '233' },
    { accent: 'border-l-orange-500', label: 'Tỷ lệ bất thường', value: '24.3%' },
    { accent: 'border-l-indigo-500', label: 'E.coli/Ciprofloxacin', value: '68.4%' },
    { accent: 'border-l-teal-500', label: 'Tương thích GPB', value: '85%' },
  ];
  const abnormalRows = [
    { color: 'bg-red-700', label: 'Glucose', value: 38 },
    { color: 'bg-red-600', label: 'Creatinin', value: 31 },
    { color: 'bg-amber-600', label: 'Cholesterol', value: 28 },
    { color: 'bg-amber-500', label: 'AST/GOT', value: 24 },
    { color: 'bg-sky-700', label: 'ALT/GPT', value: 19 },
  ];
  const amrRows = [
    ['E. coli', 'R', 'R', 'I', 'S', 'R'],
    ['K. pneumoniae', 'R', 'R', 'R', 'S', 'I'],
    ['S. aureus', 'R', 'S', 'S', 'R', 'S'],
  ];

  return (
    <>
      <SectionIntro section="lab" />
      <SummaryCards cards={cards} />
      <TabStrip active="Vi sinh & Kháng sinh đồ" />
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
        <span className="font-bold">Cảnh báo:</span> Các ô đỏ đậm (R &gt; 50%) cần báo cáo Hội đồng
        kiểm soát kháng sinh ngay.
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1fr)]">
        <ProgressRows rows={abnormalRows} title="10 chỉ số hóa sinh có tỷ lệ bất thường cao nhất" />
        <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h3 className="text-base font-bold leading-6 text-slate-800">
              Bản đồ Kháng sinh đồ (AMR Heatmap)
            </h3>
          </div>
          <div className="overflow-x-auto p-6">
            <table className="w-full min-w-[520px] text-center text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-3 text-left">Chủng vi khuẩn</th>
                  {['Penicillin', 'Ampicillin', 'Ceftriaxone', 'Vancomycin', 'Ciprofloxacin'].map((item) => (
                    <th className="px-3 py-3" key={item}>{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {amrRows.map(([name, ...values]) => (
                  <tr key={name}>
                    <td className="px-3 py-3 text-left font-medium text-slate-800">{name}</td>
                    {values.map((value, index) => (
                      <td
                        className={cn(
                          'px-3 py-3 font-bold',
                          value === 'R' && 'bg-red-50 text-red-700',
                          value === 'I' && 'bg-amber-50 text-amber-700',
                          value === 'S' && 'bg-green-50 text-green-700',
                        )}
                        key={`${name}-${index}`}
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
      </div>
    </>
  );
}

function FinanceContent() {
  const cards = [
    { accent: 'border-l-green-600', label: 'Doanh thu ngày', value: '320,5M' },
    { accent: 'border-l-sky-600', label: 'Tiền mặt', value: '198M' },
    { accent: 'border-l-teal-600', label: 'Momo / ví điện tử', value: '122,5M' },
    { accent: 'border-l-amber-500', label: 'BHYT chờ đối soát', value: '74,6M' },
  ];
  const rows = [
    ['Khám ngoại trú', '1,248 lượt', '184,2M', 'Đã ghi nhận'],
    ['Cận lâm sàng', '2,847 chỉ định', '91,8M', 'Đã có kết quả'],
    ['BHYT', '436 hồ sơ', '74,6M', 'Chờ đối soát'],
    ['Miễn giảm / write-off', '18 phiếu', '6,4M', 'Cần duyệt'],
  ];

  return (
    <>
      <SectionIntro section="finance" />
      <SummaryCards cards={cards} />
      <DataTable
        columns={['Nguồn thu', 'Sản lượng', 'Giá trị', 'Trạng thái']}
        rows={rows}
        title="Đối soát tài chính & bảo hiểm y tế"
      />
    </>
  );
}

function BedPerformanceContent() {
  const cards = [
    { accent: 'border-l-teal-600', label: 'Công suất chung', value: '87.5%' },
    { accent: 'border-l-sky-600', label: 'Giường sử dụng', value: '437 / 500' },
    { accent: 'border-l-green-600', label: 'Giường trống', value: '63' },
    { accent: 'border-l-red-600', label: 'Khoa quá tải', value: '2' },
  ];
  const rows = [
    ['Nội trú Da liễu', '92 / 100', '92%', 'Cao'],
    ['Dị ứng miễn dịch', '68 / 80', '85%', 'Ổn định'],
    ['Thẩm mỹ lâm sàng', '41 / 60', '68%', 'Còn trống'],
    ['Cấp cứu', '18 / 20', '90%', 'Theo dõi sát'],
  ];

  return (
    <>
      <SectionIntro section="beds" />
      <SummaryCards cards={cards} />
      <DataTable
        columns={['Khoa / khu điều trị', 'Đang sử dụng', 'Công suất', 'Trạng thái']}
        rows={rows}
        title="Hiệu suất giường bệnh theo khoa"
      />
    </>
  );
}

function InventoryContent() {
  const cards = [
    { accent: 'border-l-red-600', label: 'Cảnh báo tồn kho', value: '3' },
    { accent: 'border-l-amber-500', label: 'Sắp hết hạn', value: '12' },
    { accent: 'border-l-sky-600', label: 'Mã thuốc theo dõi', value: '1,436' },
    { accent: 'border-l-green-600', label: 'Đáp ứng cấp phát', value: '98.2%' },
  ];
  const rows = [
    ['Isotretinoin 10mg', '3 ngày', 'Tồn thấp', 'Ưu tiên đặt hàng'],
    ['Cetirizine 10mg', '7 ngày', 'Tồn thấp', 'Theo dõi'],
    ['Kem bôi corticoid nhóm II', '11 ngày', 'Sắp hết hạn', 'Điều phối kho'],
    ['Gạc vô khuẩn', '24 ngày', 'Ổn định', 'Đủ cấp phát'],
  ];

  return (
    <>
      <SectionIntro section="inventory" />
      <SummaryCards cards={cards} />
      <DataTable
        columns={['Thuốc / vật tư', 'Dự trữ', 'Cảnh báo', 'Khuyến nghị']}
        rows={rows}
        title="Dược phẩm & tồn kho cần chú ý"
      />
    </>
  );
}

function AuditContent() {
  const cards = [
    { accent: 'border-l-sky-600', label: 'Sự kiện hệ thống', value: '1,284' },
    { accent: 'border-l-amber-500', label: 'Bypass cần chuẩn hóa', value: '2' },
    { accent: 'border-l-green-600', label: 'Phiên đăng nhập hợp lệ', value: '96.8%' },
    { accent: 'border-l-red-600', label: 'Cảnh báo bảo mật', value: '0' },
  ];
  const rows = [
    ['Bypass hành chính', '2 ca', 'Cần chuẩn hóa', 'Không hiển thị PII'],
    ['Đăng nhập role director', '14 phiên', 'Hợp lệ', 'Read-only'],
    ['Xuất báo cáo', '8 lượt', 'Đã ghi nhận', 'Tổng hợp'],
    ['Truy cập dữ liệu nhạy cảm', '0 cảnh báo', 'An toàn', 'Không drill-down'],
  ];

  return (
    <>
      <SectionIntro section="audit" />
      <SummaryCards cards={cards} />
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
        Màn này chỉ hiển thị tổng hợp kiểm toán cho giám đốc. Nhật ký chi tiết vẫn dành cho
        admin theo workflow bảo mật.
      </div>
      <DataTable
        columns={['Nhóm sự kiện', 'Số lượng', 'Trạng thái', 'Phạm vi hiển thị']}
        rows={rows}
        title="Tổng hợp kiểm toán điều hành"
      />
    </>
  );
}

function SectionIntro({ section }: { section: DirectorSection }) {
  const meta = directorSectionMeta[section];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="text-2xl font-bold leading-8 text-slate-900">{meta.title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">{meta.subtitle}</p>
      </div>
      <button
        className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium leading-5 text-slate-900 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
        type="button"
      >
        <Icon className="h-4 w-4" name="download" />
        Xuất Excel
      </button>
    </div>
  );
}

function TabStrip({ active }: { active: string }) {
  return (
    <div className="overflow-x-auto border-b border-slate-200">
      <div className="flex min-w-max gap-8">
        {['Hóa sinh máu', 'Hóa sinh NT & Dịch', 'Giải phẫu bệnh', 'Vi sinh & Kháng sinh đồ'].map((tab) => (
          <button
            className={cn(
              'border-b-2 px-0 pb-4 text-sm font-medium leading-5',
              tab === active ? 'border-sky-700 text-sky-700' : 'border-transparent text-slate-500',
            )}
            key={tab}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

function DataTable({
  columns,
  rows,
  title,
}: {
  columns: string[];
  rows: string[][];
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
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
            {rows.map((row) => (
              <tr key={row.join('-')}>
                {row.map((cell, index) => (
                  <td
                    className={cn(
                      'px-6 py-4 text-sm leading-5',
                      index === 0 ? 'font-semibold text-slate-800' : 'text-slate-600',
                    )}
                    key={`${row[0]}-${cell}`}
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

function DirectorContent({ section }: { section: DirectorSection }) {
  if (section === 'lab') return <LabAnalyticsContent />;
  if (section === 'finance') return <FinanceContent />;
  if (section === 'beds') return <BedPerformanceContent />;
  if (section === 'inventory') return <InventoryContent />;
  if (section === 'audit') return <AuditContent />;
  return <OverviewContent />;
}

function DirectorFooter() {
  return (
    <footer className="border-t border-slate-200 py-3 text-right text-[10px] leading-4 text-slate-400">
      © 2026 HMS-VN Solution. All rights reserved.
    </footer>
  );
}

export function DirectorDashboardPage({ section = 'overview' }: { section?: DirectorSection }) {
  const meta = directorSectionMeta[section];

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 md:flex">
      <DirectorSidebar activeSection={section} />
      <div className="min-w-0 flex-1">
        <Header title={meta.title} />
        <div className="space-y-6 p-5 lg:p-8">
          <DirectorContent section={section} />
          <DirectorFooter />
        </div>
      </div>
    </main>
  );
}
