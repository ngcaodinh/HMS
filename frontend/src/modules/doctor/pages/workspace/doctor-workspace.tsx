'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { doctorWorkspaceStyles as styles } from './doctor-workspace.styles';

type DoctorScreen = 'empty' | 'vitals' | 'orders' | 'results' | 'diagnosis';
type QueueStatus = 'active' | 'waiting' | 'lab' | 'result';

type QueuePatient = {
  gender: string;
  meta: string;
  name: string;
  number: string;
  status: QueueStatus;
};

type StepId = Exclude<DoctorScreen, 'empty'>;

const assetPath = '/doctor-assets';

const queuePatients: QueuePatient[] = [
  {
    gender: 'Nữ',
    meta: '12/04/1991 · 35 tuổi',
    name: 'Nguyễn Thị Lan Anh',
    number: '03',
    status: 'active',
  },
  {
    gender: 'Nam',
    meta: '03/08/1997 · 28 tuổi',
    name: 'Phạm Văn Đức',
    number: '04',
    status: 'waiting',
  },
  {
    gender: 'Nữ',
    meta: '21/11/1973 · 52 tuổi',
    name: 'Lê Thị Hồng',
    number: '05',
    status: 'waiting',
  },
  {
    gender: 'Nam',
    meta: '09/01/1985 · 41 tuổi',
    name: 'Trần Quốc Hùng',
    number: '06',
    status: 'waiting',
  },
  {
    gender: 'Nữ',
    meta: '18/06/1958 · 67 tuổi',
    name: 'Bùi Thị Thanh',
    number: '01',
    status: 'lab',
  },
  {
    gender: 'Nam',
    meta: '30/09/2006 · 19 tuổi',
    name: 'Võ Minh Tuấn',
    number: '02',
    status: 'result',
  },
];

const steps: Array<{ id: StepId; label: string }> = [
  { id: 'vitals', label: 'Sinh hiệu' },
  { id: 'orders', label: 'Chỉ định CLS' },
  { id: 'results', label: 'Kết quả CLS' },
  { id: 'diagnosis', label: 'Chẩn đoán' },
];

const vitalSigns = [
  { label: 'Mạch', unit: 'bpm', value: '96' },
  { label: 'Nhiệt độ', unit: '°C', value: '37,2' },
  { label: 'Huyết áp', unit: 'mmHg', value: '118 / 76' },
  { label: 'Nhịp thở', unit: 'l/ph', value: '18' },
  { label: 'SPO2', unit: '%', value: '98' },
  { label: 'BMI', tone: 'bmi', unit: 'Bình thường', value: '22.5' },
  { label: 'Cân nặng', unit: 'kg', value: '62' },
  { label: 'Chiều cao', unit: 'cm', value: '166' },
];

const labOrders = [
  { name: 'Hóa sinh máu tổng quát', sample: 'Máu tĩnh mạch' },
  { name: 'Công thức máu toàn phần (CBC)', sample: 'Máu EDTA' },
  { name: 'IgE tổng (Total IgE)', sample: 'Máu tĩnh mạch' },
];

const labResults = [
  { index: 'Glucose', range: '3.9 - 6.1', status: 'normal', unit: 'mmol/L', value: '5.1' },
  { index: 'Urê', range: '2.5 - 7.5', status: 'normal', unit: 'mmol/L', value: '4.8' },
  { index: 'Creatinin', range: '45 - 90', status: 'normal', unit: 'µmol/L', value: '72' },
  { index: 'AST (SGOT)', range: '10 - 40', status: 'normal', unit: 'U/L', value: '28' },
  { index: 'ALT (SGPT)', range: '7 - 56', status: 'normal', unit: 'U/L', value: '34' },
  { index: 'Bạch cầu ái toan (Eos)', range: '1 - 5', status: 'high', unit: '%', value: '9.2%' },
  { index: 'IgE Tổng', range: '< 100', status: 'high', unit: 'IU/mL', value: '847' },
];

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function AssetIcon({
  className = 'h-4 w-4',
  name,
}: {
  className?: string;
  name: string;
}) {
  return (
    <Image
      alt=""
      className={className}
      height={24}
      src={`${assetPath}/${name}`}
      unoptimized
      width={24}
    />
  );
}

function getQueueStatusLabel(status: QueueStatus) {
  if (status === 'active') return 'Đang khám';
  if (status === 'lab') return 'Chờ KQ';
  if (status === 'result') return 'Kết quả mới';
  return 'Chờ khám';
}

function getQueueNumberClass(status: QueueStatus) {
  if (status === 'active') return 'bg-[rgba(96,165,250,0.2)] text-[#93c5fd]';
  if (status === 'lab') return 'bg-[rgba(34,211,238,0.1)] text-[#67e8f9]';
  if (status === 'result') return 'bg-[rgba(251,191,36,0.12)] text-[#fcd34d]';
  return 'bg-[rgba(251,191,36,0.2)] text-[#fcd34d]';
}

function getQueuePillClass(status: QueueStatus) {
  if (status === 'active') {
    return 'border-[rgba(96,165,250,0.4)] bg-[rgba(96,165,250,0.2)] text-[#96ccff]';
  }

  if (status === 'lab') {
    return 'border-[rgba(34,211,238,0.3)] bg-[rgba(34,211,238,0.1)] text-[#55d7ed]';
  }

  return 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.2)] text-[#fbbf24]';
}

function Sidebar({
  currentScreen,
  onSelectPatient,
}: {
  currentScreen: DoctorScreen;
  onSelectPatient: () => void;
}) {
  const stats = currentScreen === 'empty'
    ? [
        ['12', 'Đã khám', 'text-[#6ee7b7]'],
        ['08', 'Đang chờ', 'text-[#fbbf24]'],
        ['20', 'Tổng hôm nay', 'text-[#96ccff]'],
      ]
    : [
        ['2', 'Đã khám', 'text-[#6ee7b7]'],
        ['5', 'Đang chờ', 'text-[#fbbf24]'],
        ['8', 'Tổng hôm nay', 'text-[#96ccff]'],
      ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className="flex min-w-0 items-center gap-2">
          <div className={styles.logoWrap}>
            <Image
              alt="HMS-VN"
              className="h-full w-full object-cover"
              height={34}
              priority
              src={`${assetPath}/hospital-logo.jpg`}
              width={34}
            />
          </div>
          <div className="min-w-0">
            <p className={styles.brandName}>HMS-VN</p>
            <p className={styles.brandSubtitle}>Hệ thống quản lý bệnh viện</p>
          </div>
        </div>
      </div>

      <dl className={styles.statGrid}>
        {stats.map(([value, label, color]) => (
          <div className={styles.statItem} key={label}>
            <dt className={cn(styles.statValue, color)}>{value}</dt>
            <dd className={styles.statLabel}>{label}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.queueScroll}>
        <label className={styles.sidebarSearch}>
          <span className="sr-only">Tìm bệnh nhân</span>
          <AssetIcon
            className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 opacity-45"
            name="icon-search.svg"
          />
          <input className={styles.sidebarSearchInput} placeholder="Họ tên / số thứ tự..." />
        </label>

        <QueueSection title="Đang khám">
          <QueueItem
            patient={queuePatients[0]}
            selected={currentScreen !== 'empty'}
            onClick={onSelectPatient}
          />
        </QueueSection>

        <QueueSection title="Chờ khám">
          {queuePatients.slice(1, 4).map((patient) => (
            <QueueItem key={patient.number} patient={patient} onClick={onSelectPatient} />
          ))}
        </QueueSection>

        <QueueSection title="Chờ xét nghiệm">
          <QueueItem patient={queuePatients[4]} onClick={onSelectPatient} />
        </QueueSection>

        <QueueSection title="Có kết quả">
          <QueueItem patient={queuePatients[5]} onClick={onSelectPatient} />
        </QueueSection>
      </div>

      <div className={styles.sidebarUser}>
        <Image
          alt="BS. Trần Minh Khoa"
          className={styles.userAvatar}
          height={40}
          src={`${assetPath}/doctor-avatar.png`}
          width={40}
        />
        <div className="min-w-0">
          <p className={styles.userName}>BS. Trần Minh Khoa</p>
          <p className={styles.userRole}>Bác sĩ</p>
        </div>
        <button aria-label="Đăng xuất" className={styles.iconButton} type="button">
          <AssetIcon className="h-4 w-4 invert" name="icon-logout.svg" />
        </button>
      </div>
    </aside>
  );
}

function QueueSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div>
      <p className={styles.sidebarSection}>{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function QueueItem({
  onClick,
  patient,
  selected = false,
}: {
  onClick: () => void;
  patient: QueuePatient;
  selected?: boolean;
}) {
  return (
    <button className={cn(styles.queueItem, selected && styles.queueItemActive)} onClick={onClick} type="button">
      <span className={cn(styles.queueNumber, getQueueNumberClass(patient.status))}>{patient.number}</span>
      <span className="min-w-0 flex-1">
        <span className={styles.queueName}>{patient.name}</span>
        <span className={styles.queueMeta}>
          {patient.meta} · {patient.gender}
        </span>
      </span>
      <span className={cn(styles.queuePill, getQueuePillClass(patient.status))}>
        {getQueueStatusLabel(patient.status)}
      </span>
    </button>
  );
}

function Topbar({ currentScreen }: { currentScreen: DoctorScreen }) {
  const timeText = currentScreen === 'empty'
    ? ['12/10/2026', '14:30:45 ICT']
    : ['Chủ Nhật, 19/07/2026', currentScreen === 'diagnosis' ? '22:05:46 ICT' : '21:28:00 ICT'];

  return (
    <header className={styles.topbar}>
      <div className="flex min-w-0 items-center gap-3">
        <h1 className={styles.topbarTitle}>Bác sĩ · EMR – HMS-VN</h1>
        {currentScreen === 'diagnosis' && (
          <span className={cn(styles.dutyPill, 'hidden sm:inline-flex')}>Online</span>
        )}
      </div>
      <div className={styles.topbarRight}>
        <span className={styles.dutyPill}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#1b6e3f]" />
          Đang trực
        </span>
        <div className="h-6 w-px bg-[#bfc7d2]" />
        <div>
          <p className={styles.topbarTimeStrong}>{timeText[0]}</p>
          <p className={styles.topbarTime}>{timeText[1]}</p>
        </div>
      </div>
    </header>
  );
}

function PatientSummary() {
  const metrics = [
    ['Ngày sinh', '12/04/1991'],
    ['Tuổi', '35 tuổi'],
    ['Giới tính', 'Nữ'],
    ['Mã BN', 'BN-2026-00347'],
    ['STT', '#03'],
    ['Lý do khám', 'Nổi mề đay, ngứa toàn thân 3 ngày'],
  ];

  return (
    <section className={styles.patientCard}>
      <div className={styles.patientGrid}>
        <div className={styles.patientIcon}>
          <AssetIcon className="h-7 w-7" name="icon-outpatient.svg" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[18px] font-bold leading-[27px] text-[#171c1f]">Nguyễn Thị Lan Anh</h2>
            <span className={cn(styles.chip, 'bg-[#cee5ff] text-[#006096]')}>BN-2026-00347</span>
            <span className={cn(styles.chip, 'bg-[#ffdad6] text-[#ba1a1a]')}>Dị ứng: Penicillin</span>
            <span className={cn(styles.chip, 'bg-[#edf3ff] text-[#174ea6]')}>BHYT: HS4-0100-9823-1245</span>
          </div>
          <dl className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-3 xl:grid-cols-6">
            {metrics.map(([label, value]) => (
              <div key={label}>
                <dt className={styles.metricLabel}>{label}</dt>
                <dd className={styles.metricValue}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex shrink-0 flex-wrap items-start justify-start gap-2 lg:justify-end">
          <span className={cn(styles.chip, 'bg-[#e5f3ff] text-[#006096]')}>Đang khám</span>
          <span className="text-xs font-bold leading-8 text-[#707882]">Lượt khám #03</span>
          <button className={styles.outlineButton} type="button">Xem bệnh án</button>
          <button className={styles.mutedButton} type="button">Đóng hồ sơ</button>
        </div>
      </div>
    </section>
  );
}

function StepTabs({
  currentScreen,
  onChangeScreen,
}: {
  currentScreen: StepId;
  onChangeScreen: (screen: StepId) => void;
}) {
  return (
    <nav aria-label="Quy trình khám" className={styles.stepTabs}>
      {steps.map((step, index) => {
        const active = currentScreen === step.id;

        return (
          <button
            aria-current={active ? 'step' : undefined}
            className={cn(styles.stepTab, active && styles.stepTabActive)}
            key={step.id}
            onClick={() => onChangeScreen(step.id)}
            type="button"
          >
            <span className={cn(styles.stepNumber, active && styles.stepNumberActive)}>{index + 1}</span>
            {step.label}
            {step.id === 'results' && <span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24]" />}
            {index < steps.length - 1 && <span className="ml-1 text-[#bfc7d2]">›</span>}
          </button>
        );
      })}
    </nav>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  const cards = [
    ['1', 'Chọn BN', 'Chọn BN từ cột Đang chờ hoặc Có kết quả.'],
    ['2', 'Mở Tab', 'Hệ thống tự động mở Tab Sinh hiệu và thông tin hành chính.'],
    ['3', 'Khám & CĐ', 'Thực hiện khám lâm sàng, chỉ định CLS và chẩn đoán.'],
  ];

  return (
    <section className={styles.emptyState}>
      <div className={styles.emptyIconWrap}>
        <AssetIcon className="h-[94px] w-[94px]" name="icon-empty-medical.svg" />
      </div>
      <h2 className="mt-5 text-base font-bold leading-6 text-[#171c1f]">Sẵn sàng tiếp nhận bệnh nhân</h2>
      <p className="mt-4 max-w-[448px] text-center text-base leading-[26px] text-[#41474f]">
        Vui lòng chọn một bệnh nhân từ danh sách hàng đợi bên trái để bắt đầu quá trình khám lâm
        sàng.
      </p>
      <div className="mt-5 flex w-full max-w-[400px] flex-col gap-4">
        {cards.map(([number, title, description]) => (
          <article className={styles.emptyGuideCard} key={number}>
            <span className={styles.emptyGuideNumber}>{number}</span>
            <h3 className="mt-2 text-base font-bold leading-6 text-[#171c1f]">{title}</h3>
            <p className="mt-1 text-base leading-6 text-[#41474f]">{description}</p>
          </article>
        ))}
      </div>
      <button className={cn(styles.primaryButton, 'mt-6 px-6 text-base font-bold')} onClick={onStart} type="button">
        <AssetIcon className="h-4 w-[22px] brightness-0 invert" name="icon-call-next.svg" />
        Gọi bệnh nhân kế tiếp
      </button>
    </section>
  );
}

function ReadOnlyField({
  label,
  textarea = false,
  value,
}: {
  label: string;
  textarea?: boolean;
  value: string;
}) {
  return (
    <label>
      <span className={styles.fieldLabel}>{label}</span>
      {textarea ? (
        <textarea className={styles.textarea} readOnly value={value} />
      ) : (
        <input className={styles.input} readOnly value={value} />
      )}
    </label>
  );
}

function VitalsScreen() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardIcon}>
            <AssetIcon className="h-[18px] w-[18px]" name="icon-save.svg" />
          </span>
          Chỉ số sinh hiệu
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vitalSigns.map((vital) => (
            <label key={vital.label}>
              <span className={styles.fieldLabel}>{vital.label}</span>
              <span className={cn(styles.input, 'flex items-center justify-between', vital.tone === 'bmi' && 'bg-[#eaeef2]')}>
                <span className={cn(vital.tone === 'bmi' && 'text-base font-bold text-[#006096]')}>
                  {vital.value}
                </span>
                <span className={cn('text-[11px] font-semibold text-[#707882]', vital.tone === 'bmi' && 'text-[#1b6e3f]')}>
                  {vital.unit}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardIcon}>
            <AssetIcon className="h-[18px] w-[18px]" name="icon-clinical.svg" />
          </span>
          Bệnh sử & khám lâm sàng
        </h2>
        <div className="mt-5 space-y-4">
          <ReadOnlyField label="Lý do khám bệnh" value="Nổi mề đay, ngứa toàn thân 3 ngày" />
          <ReadOnlyField
            label="Bệnh sử lâm sàng"
            textarea
            value="Bệnh nhân nữ, 35 tuổi, xuất hiện mề đay lan toả vùng thân mình và tứ chi khoảng 3 ngày trước, ngứa nhiều về đêm, không sốt. Đã dùng loratadine 10mg tự mua tại nhà, đỡ ít. Tiền sử dị ứng Penicillin (phản ứng nổi mề đay năm 2019)."
          />
          <ReadOnlyField
            label="Ghi chú dị ứng / tiền sử"
            textarea
            value="Dị ứng Penicillin - nổi mề đay (2019). Không dùng nhóm beta-lactam nếu không có chỉ định bắt buộc."
          />
          <p className="rounded-md border border-[#bfc7d2] bg-[#ffdad6] px-3 py-3 text-[11px] font-semibold text-[#ba1a1a]">
            <strong>Dị ứng đã ghi nhận:</strong> Penicillin
          </p>
        </div>
      </section>
      <div className="flex justify-end xl:col-span-2">
        <button className={styles.primaryButton} type="button">
          <AssetIcon className="h-4 w-4 brightness-0 invert" name="icon-save.svg" />
          Lưu thông tin khám
        </button>
      </div>
    </div>
  );
}

function OrdersScreen() {
  return (
    <section className={styles.card}>
      <div className="mb-4 rounded-[12px] border border-[rgba(0,96,150,0.2)] bg-[rgba(0,96,150,0.05)] px-4 py-3 text-sm font-medium text-[#0369a1]">
        Đã gửi chỉ định xét nghiệm - trạng thái hàng đợi: chờ / có kết quả Lab.
      </div>
      <h2 className={styles.cardTitle}>
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#e0f7fa]">
          <AssetIcon className="h-5 w-5" name="icon-lab-order.svg" />
        </span>
        Chỉ định dịch vụ xét nghiệm
      </h2>
      <label className="mt-6 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.3px] text-[#707882]">
          Tìm dịch vụ cận lâm sàng
        </span>
        <span className="relative block">
          <AssetIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" name="icon-search.svg" />
          <input
            className="h-12 w-full rounded-[12px] border border-[#bfc7d2] bg-[#f2f3f8] pl-11 pr-4 text-sm outline-none placeholder:text-[#6b7280]"
            placeholder="Gõ tên dịch vụ (VD: Hóa sinh máu, IgE...)"
          />
        </span>
      </label>
      <LabOrderTable />
      <div className="mt-6 flex justify-end">
        <button className={styles.primaryButton} type="button">Gửi chỉ định xét nghiệm</button>
      </div>
    </section>
  );
}

function LabOrderTable() {
  return (
    <div className="mt-5 overflow-x-auto">
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>STT</th>
              <th className={styles.th}>Tên dịch vụ</th>
              <th className={styles.th}>Loại mẫu</th>
              <th className={styles.th}>Trạng thái</th>
              <th className={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef2f7] bg-white">
            {labOrders.map((order, index) => (
              <tr key={order.name}>
                <td className={styles.td}>{index + 1}</td>
                <td className={cn(styles.td, 'font-bold text-[#001d32]')}>{order.name}</td>
                <td className={styles.td}>{order.sample}</td>
                <td className={styles.td}>
                  <span className={styles.statusNormal}>Có kết quả</span>
                </td>
                <td className={styles.td}>
                  <span className="block h-4 w-4 rounded bg-[#e8eef3]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultsScreen() {
  return (
    <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
      <aside className={styles.card}>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardIcon}>
            <AssetIcon className="h-[18px] w-[18px]" name="icon-lab-result.svg" />
          </span>
          Kết quả cận lâm sàng
        </h2>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.6px] text-[#707882]">
          Dịch vụ đã chỉ định
        </p>
        <div className="mt-3 space-y-2">
          {labOrders.map((order, index) => (
            <button
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium',
                index === 0 ? 'border border-[#bfc7d2] bg-[#e8f5fb] text-[#006096]' : 'text-[#171c1f]',
              )}
              key={order.name}
              type="button"
            >
              <span className="h-2 w-2 rounded-full bg-[#1b6e3f]" />
              {order.name}
            </button>
          ))}
        </div>
      </aside>

      <section className={styles.card}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold leading-6">Hóa sinh máu tổng quát</h2>
            <p className="text-[11px] leading-[16.5px] text-[#707882]">
              KTV. Phạm Thị Ngọc Lan · Xác nhận: 08:58 · Phiếu #LAB-2026-0709-1182
            </p>
          </div>
          <div className="flex gap-2">
            <button className={styles.mutedButton} type="button">In phiếu</button>
            <button className={styles.primaryButton} type="button">Tải tệp đính kèm gốc</button>
          </div>
        </div>
        <LabResultTable />
      </section>
    </div>
  );
}

function LabResultTable() {
  return (
    <div className="overflow-x-auto">
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Chỉ số</th>
              <th className={styles.th}>Kết quả</th>
              <th className={styles.th}>Đơn vị</th>
              <th className={styles.th}>Tham chiếu</th>
              <th className={styles.th}>Đánh giá</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef2f7] bg-white">
            {labResults.map((result) => {
              const high = result.status === 'high';

              return (
                <tr className={cn(high && 'bg-[rgba(254,242,242,0.4)]')} key={result.index}>
                  <td className={styles.td}>{result.index}</td>
                  <td className={cn(styles.td, 'font-bold', high && 'text-[#dc2626]')}>{result.value}</td>
                  <td className={styles.td}>{result.unit}</td>
                  <td className={styles.td}>{result.range}</td>
                  <td className={styles.td}>
                    <span className={high ? styles.statusHigh : styles.statusNormal}>
                      {high ? 'Cao' : 'Bình thường'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DiagnosisScreen() {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-[15px] font-bold leading-[22.5px]">
          Chẩn đoán bệnh & Quyết định hướng điều trị
        </h2>
        <p className="text-xs leading-[18px] text-[#3f4851]">
          Chọn mã ICD-10 (TT 06/2026/TT-BYT). Mã đầu tiên là bệnh chính. Quyết định NGOẠI TRÚ
          hoặc NỘI TRÚ.
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>
              <AssetIcon className="h-4 w-4" name="icon-icd.svg" />
            </span>
            Mã bệnh ICD-10
          </h3>
          <label className="mt-6 block">
            <span className={styles.fieldLabel}>Tìm mã ICD-10 <span className="text-[#ef4444]">*</span></span>
            <span className="relative block">
              <AssetIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" name="icon-search.svg" />
              <input
                className="h-12 w-full rounded-[12px] border border-[#bfc7d2] bg-[#f0f4f8] pl-11 pr-4 text-[13.5px] outline-none"
                placeholder="Mã hoặc tên bệnh (VD: L50, Mề đay...)"
              />
            </span>
            <span className="mt-2 block text-[11px] leading-[13.75px] text-[#707882]">
              Gõ mã (L50) hoặc tên bệnh. Có thể chọn nhiều mã; mã đầu = bệnh chính.
            </span>
          </label>
          <div className="mt-5">
            <p className={styles.fieldLabel}>Mã đã chọn</p>
            <span className="inline-flex items-center gap-2 rounded-md bg-[#006096] px-3 py-2 text-xs font-bold text-white shadow-[0_1px_2px_rgba(0,96,150,0.25)]">
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] uppercase">Chính</span>
              L50.0 - Mề đay dị ứng
              <AssetIcon className="h-3 w-3 brightness-0 invert" name="icon-close.svg" />
            </span>
          </div>
          <div className="mt-5">
            <ReadOnlyField
              label="Diễn giải chẩn đoán chi tiết"
              textarea
              value="Mề đay cấp dị ứng, IgE tổng tăng cao (847 IU/mL), bạch cầu ái toan tăng 9.2%. Loại trừ dị ứng thuốc (Penicillin đã biết)."
            />
          </div>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-[#d4f0e0]">
              <AssetIcon className="h-5 w-5" name="icon-treatment.svg" />
            </span>
            Hướng điều trị
          </h3>
          <p className="mt-6 text-[11px] leading-[17.88px] text-[#707882]">
            Chọn một hướng - hệ thống mở Tab 5A (đơn thuốc) hoặc Tab 5B (y lệnh nội trú) sau khi
            lưu.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <TreatmentChoice
              active
              description="Kê đơn thuốc điện tử, điều trị tại nhà (Tab 5A)"
              icon="icon-outpatient.svg"
              title="Ngoại trú"
            />
            <TreatmentChoice
              description="Nhập viện, y lệnh hằng ngày & giường khoa (Tab 5B)"
              icon="icon-inpatient.svg"
              title="Nội trú"
            />
          </div>
          <button className={cn(styles.primaryButton, 'mt-8 w-full rounded-[12px]')} type="button">
            Xác nhận & Lưu chẩn đoán
          </button>
        </section>
      </div>
    </section>
  );
}

function TreatmentChoice({
  active = false,
  description,
  icon,
  title,
}: {
  active?: boolean;
  description: string;
  icon: string;
  title: string;
}) {
  return (
    <button
      className={cn(
        'relative min-h-[156px] rounded-[16px] border-2 p-5 text-left transition focus:outline-none focus:ring-4 focus:ring-[#006096]/15',
        active ? 'border-[#006096] bg-[rgba(0,96,150,0.06)] shadow-[0_0_0_3px_rgba(0,96,150,0.12)]' : 'border-[#bfc7d2] bg-[#f0f4f8]',
      )}
      type="button"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#cee5ff]">
        <AssetIcon className="h-5 w-5" name={icon} />
      </span>
      <span className="mt-5 block text-[15px] font-extrabold uppercase leading-[22.5px]">{title}</span>
      <span className="mt-1 block text-xs leading-[16.5px] text-[#3f4851]">{description}</span>
      <span className={cn('absolute right-4 top-4 h-5 w-5 rounded-full border-2', active ? 'border-[#006096] p-1' : 'border-[#bfc7d2]')}>
        {active && <span className="block h-full w-full rounded-full bg-[#006096]" />}
      </span>
    </button>
  );
}

function ActiveScreen({
  currentScreen,
  onChangeScreen,
}: {
  currentScreen: DoctorScreen;
  onChangeScreen: (screen: DoctorScreen) => void;
}) {
  if (currentScreen === 'empty') {
    return <EmptyState onStart={() => onChangeScreen('vitals')} />;
  }

  if (currentScreen === 'vitals') return <VitalsScreen />;
  if (currentScreen === 'orders') return <OrdersScreen />;
  if (currentScreen === 'results') return <ResultsScreen />;

  return <DiagnosisScreen />;
}

export function DoctorWorkspacePage() {
  const [currentScreen, setCurrentScreen] = useState<DoctorScreen>('empty');
  const activeStep = useMemo<StepId>(
    () => (currentScreen === 'empty' ? 'vitals' : currentScreen),
    [currentScreen],
  );

  return (
    <main className={styles.page}>
      <Sidebar currentScreen={currentScreen} onSelectPatient={() => setCurrentScreen('vitals')} />
      <section className={styles.workspace}>
        <Topbar currentScreen={currentScreen} />
        <div className={cn(styles.body, currentScreen === 'empty' && styles.bodyEmpty)}>
          {currentScreen !== 'empty' && (
            <>
              <PatientSummary />
              <StepTabs currentScreen={activeStep} onChangeScreen={setCurrentScreen} />
            </>
          )}
          <ActiveScreen currentScreen={currentScreen} onChangeScreen={setCurrentScreen} />
        </div>
        <footer className={styles.footer}>© 2026 HMS-VN Solution. All rights reserved.</footer>
      </section>
    </main>
  );
}
