'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

import {
  navItems,
  orderTypeLabels,
  queuePatients,
  screenMeta,
  vitalFields,
  vitalStats,
  type IconName,
  type NurseScreen,
  type StatCard,
  type VitalField,
} from './nurse-workspace.data';
import {
  useBeds,
  useOrders,
  useAdmissionBoard,
  useAssignBed,
  useChangeBedAssignment,
  useProcessDischarge,
  useUpdateOrderStatus,
  useCancelOrder,
  useVitalsQueue,
  useCallNextTicket,
  useRecallTicket,
  useRecordVitalSigns,
  useToggleMaintenance,
  useSpecimens,
  useCollectSpecimen,
  usePrintSpecimenBarcode,
  useHandoffSpecimen,
  useUnidentifiedEmergencyPatients,
  useStandardizeEmergencyIdentity,
  type BedDto,
  type OrderDto,
  type AdmissionBoardDto,
  type VitalsWorklistItemDto,
  type QueueTicketDto,
  type VitalsQueueStatsDto,
  type SpecimenDto,
} from '../../hooks/useLane6';
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
  const router = useRouter();

  const { data: vitalsQueueData } = useVitalsQueue();
  const { data: specimens = [] } = useSpecimens();
  const { data: apiOrders = [] } = useOrders();
  const { data: unidentifiedEmergencyPatients = [] } = useUnidentifiedEmergencyPatients();

  const badgeCounts: Partial<Record<NurseScreen, number>> = {
    vitals: vitalsQueueData?.worklist.length ?? vitalsQueueData?.stats.waitingCount ?? 0,
    samples: specimens.filter((s) => s.status !== 'handed_over').length,
    orders: apiOrders.length,
    emergency: unidentifiedEmergencyPatients.length,
  };

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
          const badgeCount = badgeCounts[item.id];

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
              {Boolean(badgeCount) && (
                <span
                  className={cn(
                    styles.badge,
                    item.id === 'samples' ? 'bg-[#006096]' : 'bg-[#ba1a1a]',
                  )}
                >
                  {badgeCount}
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
        <button
          aria-label="Đăng xuất"
          className={styles.iconButton}
          onClick={() => router.push('/login')}
          type="button"
        >
          <Icon name="logOut" />
        </button>
      </div>
    </aside>
  );
}

function Topbar({ activeScreen }: { activeScreen: NurseScreen }) {
  const meta = screenMeta[activeScreen];
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = useMemo(() => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const day = String(currentTime.getDate()).padStart(2, '0');
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const year = currentTime.getFullYear();
    return `${displayHours}:${displayMinutes} ${ampm} ${day}/${month}/${year}`;
  }, [currentTime]);

  const subtitlePrefix = useMemo(
    () => meta.subtitle.split(' • ').slice(0, -1).join(' • '),
    [meta.subtitle]
  );
  const subtitle = `${subtitlePrefix} • ${formattedTime}`;

  return (
    <header className={styles.topbar}>
      <div className="min-w-0">
        <h1 className={cn('truncate text-lg font-bold leading-7 text-[#006096]', meta.titleClass)}>
          {meta.title}
        </h1>
        <p className="truncate text-xs font-medium leading-4 text-[#3f4851]">{subtitle}</p>
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
              <p className={cn('text-2xl font-bold leading-6 text-[#171c1f]', stat.valueClass)}>
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium uppercase leading-4 text-[#3f4851]">
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
          <Icon className="h-4 w-4 text-[#006096]" name={icon} />
          {title}
        </h2>
        {count && <span className="text-xs font-medium leading-4 text-[#3f4851]">{count}</span>}
      </div>
      {children}
    </section>
  );
}

function PatientQueue({
  ticketQueue,
  worklist,
  selectedRecordId,
  calledRecordIds,
  hasUnsavedInput,
  onCallNext,
  onRecall,
  onSelectRecord,
  isCalling,
}: {
  ticketQueue: { currentCalled: QueueTicketDto | null; waitingCount: number };
  worklist: VitalsWorklistItemDto[];
  selectedRecordId: string | null;
  calledRecordIds: Set<string>;
  hasUnsavedInput: boolean;
  onCallNext: () => void;
  onRecall: () => void;
  onSelectRecord: (item: VitalsWorklistItemDto) => void;
  isCalling: boolean;
}) {
  return (
    <Card count={`${ticketQueue.waitingCount} số đang chờ`} icon="clipboard" title="Hàng đợi chờ đo sinh hiệu">
      <div className="p-3">
        <div className="mb-2 rounded-lg bg-[#eaeef2] p-3 text-center">
          <p className="text-xs font-medium text-[#3f4851]">Số đang gọi</p>
          <p className="text-3xl font-bold text-[#006096]">
            {ticketQueue.currentCalled ? String(ticketQueue.currentCalled.number).padStart(2, '0') : '--'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={cn(styles.primaryButton, 'h-16 px-4 text-sm')}
            type="button"
            disabled={isCalling || hasUnsavedInput || ticketQueue.waitingCount === 0}
            title={hasUnsavedInput ? 'Hãy lưu hoặc hủy dữ liệu đang nhập trước khi gọi số mới' : undefined}
            onClick={onCallNext}
          >
            <Icon name="heart" />
            Gọi số tiếp theo
            <span className="rounded-sm bg-white/20 px-1.5 py-0.5 text-[10px]">F2</span>
          </button>
          <button
            className={cn(styles.secondaryButton, 'h-16 text-[#006096]')}
            type="button"
            disabled={isCalling || !ticketQueue.currentCalled}
            onClick={onRecall}
          >
            <Icon name="refresh" />
            Gọi lại
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-auto border-t border-[#bfc7d2]">
        {worklist.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#3f4851]">Không có bệnh nhân chờ đo</div>
        ) : (
          worklist.map((item) => {
            const active = item.recordId === selectedRecordId;
            const isCalled = !active && calledRecordIds.has(item.recordId);
            return (
              <button
                className={cn(
                  'flex w-full items-center gap-3 border-b border-[#bfc7d2] p-4 text-left transition hover:bg-[#f0f4f8]',
                  active && 'border-l-4 border-l-[#006096] bg-[#e0f2fe]'
                )}
                key={item.recordId}
                type="button"
                onClick={() => onSelectRecord(item)}
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate text-xs font-bold uppercase leading-5',
                      active ? 'text-[#006096]' : 'text-[#171c1f]'
                    )}
                  >
                    {item.patientName}
                  </span>
                  <span className="block truncate text-xs font-medium leading-4 text-[#3f4851]">
                    {`${item.gender}, ${item.age}t — BA: ${item.recordCode}`}
                  </span>
                </span>
                <span
                  className={cn(
                    'rounded-sm px-2 py-1 text-[10px] font-bold uppercase leading-4',
                    active
                      ? 'bg-red-100 text-[#ba1a1a]'
                      : isCalled
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-50 text-[#006096]'
                  )}
                >
                  {active ? 'Đang chọn' : isCalled ? 'Đã gọi' : 'Chọn'}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}

interface VitalsFormState {
  pulse: string;
  temperatureC: string;
  bpSystolic: string;
  bpDiastolic: string;
  respiratoryRate: string;
  spo2: string;
  heightCm: string;
  weightKg: string;
  allergyEnabled: boolean;
  allergyNote: string;
}

const emptyVitalsForm: VitalsFormState = {
  pulse: '',
  temperatureC: '',
  bpSystolic: '',
  bpDiastolic: '',
  respiratoryRate: '',
  spo2: '',
  heightCm: '',
  weightKg: '',
  allergyEnabled: false,
  allergyNote: '',
};

const VITAL_LIMITS = {
  pulse: { min: 0, max: 300, label: 'mạch' },
  temperatureC: { min: 25, max: 45, label: 'nhiệt độ' },
  bpSystolic: { min: 0, max: 300, label: 'huyết áp tâm thu' },
  bpDiastolic: { min: 0, max: 300, label: 'huyết áp tâm trương' },
  respiratoryRate: { min: 0, max: 120, label: 'nhịp thở' },
  spo2: { min: 0, max: 100, label: 'SpO2' },
  heightCm: { min: 0, max: 300, label: 'chiều cao' },
  weightKg: { min: 0, max: 500, label: 'cân nặng' },
} as const;

function getVitalFieldError(key: keyof typeof VITAL_LIMITS, value: string): string | undefined {
  if (!value) return undefined;
  const { min, max, label } = VITAL_LIMITS[key];
  const num = Number(value);
  if (Number.isNaN(num) || num < min || num > max) {
    return `Giá trị ${label} không hợp lệ (${min}-${max})`;
  }
  return undefined;
}

function VitalInputField({
  label,
  unit,
  value,
  onChange,
  error,
  step,
  required,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className={styles.label}>
        {label}
        {required ? ' *' : ''}
      </span>
      <span className="flex">
        <input
          type="number"
          step={step}
          className={cn(
            styles.input,
            'rounded-r-none',
            error && 'border-red-400 text-[#ba1a1a] focus:border-red-500 focus:ring-red-500/10'
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className={styles.fieldUnit}>{unit}</span>
      </span>
      {error && <p className="mt-1 text-xs font-bold text-[#ba1a1a]">{error}</p>}
    </label>
  );
}

const ALL_VITAL_FIELDS = [
  'pulse',
  'temperatureC',
  'bpSystolic',
  'bpDiastolic',
  'respiratoryRate',
  'spo2',
  'heightCm',
  'weightKg',
] as const;

function VitalsForm({
  selectedRecord,
  activeTicket,
  form,
  setForm,
  onSave,
  onCancel,
  isSaving,
  bmiValue,
  attemptedSave,
}: {
  selectedRecord: VitalsWorklistItemDto | null;
  activeTicket: QueueTicketDto | null;
  form: VitalsFormState;
  setForm: React.Dispatch<React.SetStateAction<VitalsFormState>>;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  bmiValue: string;
  attemptedSave: boolean;
}) {
  const missingOnSubmit = useMemo(() => {
    const set = new Set<string>();
    if (attemptedSave) {
      ALL_VITAL_FIELDS.forEach((key) => {
        if (!form[key]) set.add(key);
      });
    }
    return set;
  }, [attemptedSave, form]);

  const reminderFieldError = (key: (typeof ALL_VITAL_FIELDS)[number]): string | undefined =>
    missingOnSubmit.has(key) ? 'Vui lòng nhập giá trị này' : undefined;

  const fieldErrors = useMemo(
    () => ({
      pulse: getVitalFieldError('pulse', form.pulse) || reminderFieldError('pulse'),
      temperatureC: getVitalFieldError('temperatureC', form.temperatureC) || reminderFieldError('temperatureC'),
      bpSystolic: getVitalFieldError('bpSystolic', form.bpSystolic) || reminderFieldError('bpSystolic'),
      bpDiastolic: getVitalFieldError('bpDiastolic', form.bpDiastolic) || reminderFieldError('bpDiastolic'),
      respiratoryRate:
        getVitalFieldError('respiratoryRate', form.respiratoryRate) || reminderFieldError('respiratoryRate'),
      spo2: getVitalFieldError('spo2', form.spo2) || reminderFieldError('spo2'),
      heightCm: getVitalFieldError('heightCm', form.heightCm) || reminderFieldError('heightCm'),
      weightKg: getVitalFieldError('weightKg', form.weightKg) || reminderFieldError('weightKg'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, missingOnSubmit]
  );
  const hasFormatErrors = [
    getVitalFieldError('pulse', form.pulse),
    getVitalFieldError('temperatureC', form.temperatureC),
    getVitalFieldError('bpSystolic', form.bpSystolic),
    getVitalFieldError('bpDiastolic', form.bpDiastolic),
    getVitalFieldError('respiratoryRate', form.respiratoryRate),
    getVitalFieldError('spo2', form.spo2),
    getVitalFieldError('heightCm', form.heightCm),
    getVitalFieldError('weightKg', form.weightKg),
  ].some(Boolean);

  const allergyNoteMissing = attemptedSave && form.allergyEnabled && !form.allergyNote.trim();

  const canSave = Boolean(activeTicket) && Boolean(selectedRecord) && !isSaving && !hasFormatErrors;

  return (
    <Card icon="heart" title="Chỉ số sinh tồn (Vital signs)">
      <div className="space-y-6 p-6">
        {selectedRecord ? (
          <div className="rounded-lg bg-[#e0f2fe] p-3 text-xs font-bold text-[#006096]">
            Đang nhập sinh hiệu cho: <span className="uppercase">{selectedRecord.patientName}</span> ({selectedRecord.gender}, {selectedRecord.age}t — BA: {selectedRecord.recordCode})
          </div>
        ) : (
          <div className="rounded-lg bg-[#eaeef2] p-3 text-xs font-medium text-[#3f4851]">
            Chưa chọn bệnh nhân — hãy gọi số và chọn bệnh nhân từ danh sách bên trái
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <VitalInputField
            label="Mạch (lần/phút)"
            unit="bpm"
            required
            value={form.pulse}
            error={fieldErrors.pulse}
            onChange={(v) => setForm((prev) => ({ ...prev, pulse: v }))}
          />

          <VitalInputField
            label="Nhiệt độ (°C)"
            unit="°C"
            step="0.1"
            value={form.temperatureC}
            error={fieldErrors.temperatureC}
            onChange={(v) => setForm((prev) => ({ ...prev, temperatureC: v }))}
          />

          <VitalInputField
            label="Huyết áp tâm thu (mmHg)"
            unit="mmHg"
            required
            value={form.bpSystolic}
            error={fieldErrors.bpSystolic}
            onChange={(v) => setForm((prev) => ({ ...prev, bpSystolic: v }))}
          />

          <VitalInputField
            label="Huyết áp tâm trương (mmHg)"
            unit="mmHg"
            required
            value={form.bpDiastolic}
            error={fieldErrors.bpDiastolic}
            onChange={(v) => setForm((prev) => ({ ...prev, bpDiastolic: v }))}
          />

          <VitalInputField
            label="Nhịp thở (lần/phút)"
            unit="lần/ph"
            value={form.respiratoryRate}
            error={fieldErrors.respiratoryRate}
            onChange={(v) => setForm((prev) => ({ ...prev, respiratoryRate: v }))}
          />

          <VitalInputField
            label="SpO2 (%)"
            unit="%"
            required
            value={form.spo2}
            error={fieldErrors.spo2}
            onChange={(v) => setForm((prev) => ({ ...prev, spo2: v }))}
          />

          <VitalInputField
            label="Chiều cao (cm)"
            unit="cm"
            value={form.heightCm}
            error={fieldErrors.heightCm}
            onChange={(v) => setForm((prev) => ({ ...prev, heightCm: v }))}
          />

          <VitalInputField
            label="Cân nặng (kg)"
            unit="kg"
            step="0.1"
            value={form.weightKg}
            error={fieldErrors.weightKg}
            onChange={(v) => setForm((prev) => ({ ...prev, weightKg: v }))}
          />

          <label>
            <span className={styles.label}>Chỉ số BMI (tự tính)</span>
            <div className="flex h-10 items-center rounded-lg border border-[#bfc7d2] bg-[#eaeef2] px-4 text-sm font-bold text-[#3f4851]">
              {bmiValue}
            </div>
          </label>
        </div>

        <div>
          <p className={styles.label}>Tiền sử dị ứng</p>
          <div
            className={cn(
              'rounded-xl border-2 p-4 transition-colors',
              form.allergyEnabled
                ? 'border-[#ba1a1a]/40 bg-red-50/50'
                : 'border-[#bfc7d2] bg-[#f0f4f8]',
              allergyNoteMissing && 'animate-blink-red'
            )}
          >
            <div className="flex flex-wrap items-center gap-4">
              <button
                aria-pressed={form.allergyEnabled}
                className={cn(
                  'relative h-6 w-12 rounded-full shadow-inner focus:outline-none focus:ring-4 transition-colors',
                  form.allergyEnabled
                    ? 'bg-[#ba1a1a] focus:ring-[#ba1a1a]/20'
                    : 'bg-[#bfc7d2] focus:ring-gray-200'
                )}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, allergyEnabled: !prev.allergyEnabled }))}
              >
                <span
                  className={cn(
                    'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all',
                    form.allergyEnabled ? 'right-1' : 'left-1'
                  )}
                />
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm font-bold leading-5',
                    form.allergyEnabled ? 'text-[#ba1a1a]' : 'text-[#3f4851]'
                  )}
                >
                  {form.allergyEnabled ? 'Có dị ứng thuốc / thức ăn' : 'Không có tiền sử dị ứng'}
                </p>
                <p className="text-xs font-medium leading-4 text-[#3f4851]">
                  {form.allergyEnabled
                    ? 'Vui lòng ấn nút lại để tắt chức năng nhập dị ứng'
                    : 'Vui lòng ấn nút để nhập dị ứng cho bệnh nhân'}
                </p>
              </div>
              {form.allergyEnabled && <Icon className="h-6 w-6 text-[#ba1a1a]" name="alert" />}
            </div>

            <div className="relative mt-4">
              <textarea
                className={cn(
                  styles.textarea,
                  form.allergyEnabled
                    ? 'border-[#ba1a1a]/40 bg-white'
                    : 'border-[#bfc7d2] bg-[#e4e9ed]/40 text-[#707882] cursor-not-allowed'
                )}
                disabled={!form.allergyEnabled}
                value={form.allergyNote}
                onChange={(e) => setForm((prev) => ({ ...prev, allergyNote: e.target.value }))}
                placeholder="Nhập mô tả chi tiết: tên thuốc, loại thức ăn gây dị ứng và biểu hiện dị ứng... Ví dụ: Penicillin → nổi mề đay toàn thân"
              />
              {form.allergyEnabled && !form.allergyNote.trim() && (
                <p className="mt-1 text-xs font-bold text-[#ba1a1a]">
                  Vui lòng nhập mô tả chi tiết dị ứng trước khi lưu
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 rounded-b-xl border-t border-[#bfc7d2] bg-[#f0f4f8] p-4">
        <button className={styles.secondaryButton} type="button" onClick={onCancel}>
          Hủy
        </button>
        <button
          className={cn(styles.primaryButton, 'px-8 text-sm')}
          type="button"
          disabled={!canSave}
          onClick={onSave}
        >
          <Icon name="check" />
          {isSaving ? 'Đang lưu...' : 'Lưu kết quả (F9)'}
        </button>
      </div>
    </Card>
  );
}

const VITALS_QUEUE_STATE_KEY = 'nurse:vitals-queue-state';

function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function VitalsScreen() {
  const { data, isLoading } = useVitalsQueue();
  const { mutate: callNext, isPending: isCalling } = useCallNextTicket();
  const { mutate: recall } = useRecallTicket();
  const { mutate: saveVitalSigns, isPending: isSaving } = useRecordVitalSigns();

  const [selectedRecord, setSelectedRecord] = useState<VitalsWorklistItemDto | null>(null);
  const [calledOrder, setCalledOrder] = useState<string[]>([]);
  const [form, setForm] = useState<VitalsFormState>(emptyVitalsForm);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const activeTicket = data?.ticketQueue.currentCalled ?? null;
  const worklist = data?.worklist ?? [];
  const statsData = data?.stats;

  const calledRecordIds = useMemo(() => new Set(calledOrder), [calledOrder]);

  useEffect(() => {
    if (hydratedRef.current || !data) return;
    hydratedRef.current = true;

    try {
      const raw = window.localStorage.getItem(VITALS_QUEUE_STATE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { date?: string; selectedRecordId?: string | null; calledOrder?: string[] };
      const today = getTodayDateString();
      if (parsed && parsed.date === today) {
        const validWorklist = data.worklist || [];
        const validIds = new Set(validWorklist.map((w) => w.recordId));

        const restoredCalledOrder = (parsed.calledOrder || []).filter((id) => validIds.has(id));
        setCalledOrder(restoredCalledOrder);

        if (parsed.selectedRecordId && validIds.has(parsed.selectedRecordId)) {
          const found = validWorklist.find((w) => w.recordId === parsed.selectedRecordId);
          if (found) {
            setSelectedRecord(found);
            if (found.allergies && found.allergies.trim()) {
              setForm((prev) => ({
                ...prev,
                allergyEnabled: true,
                allergyNote: found.allergies ? found.allergies.trim() : '',
              }));
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse vitals queue state from localStorage', e);
    }
  }, [data]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      const payload = {
        date: getTodayDateString(),
        selectedRecordId: selectedRecord?.recordId ?? null,
        calledOrder,
      };
      window.localStorage.setItem(VITALS_QUEUE_STATE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save vitals queue state to localStorage', e);
    }
  }, [selectedRecord?.recordId, calledOrder]);

  const hasUnsavedInput = useMemo(() => {
    return Object.entries(form).some(([k, v]) => k !== 'allergyEnabled' && v !== '' && v !== false);
  }, [form]);

  const bmiValue = useMemo(() => {
    const h = Number(form.heightCm);
    const w = Number(form.weightKg);
    if (h > 0 && w > 0) {
      const bmi = w / ((h / 100) ** 2);
      return bmi.toFixed(1);
    }
    return '-';
  }, [form.heightCm, form.weightKg]);

  const selectRecordAndResetForm = useCallback((item: VitalsWorklistItemDto | null) => {
    setSelectedRecord(item);
    setAttemptedSave(false);
    if (item && item.allergies && item.allergies.trim()) {
      setForm({
        ...emptyVitalsForm,
        allergyEnabled: true,
        allergyNote: item.allergies.trim(),
      });
    } else {
      setForm(emptyVitalsForm);
    }
  }, []);

  const handleCallNext = useCallback(() => {
    if (hasUnsavedInput || isCalling) return;

    if ((data?.ticketQueue.waitingCount ?? 0) > 0) {
      callNext();
    }

    const currentWorklist = data?.worklist ?? [];
    if (currentWorklist.length === 0) return;

    let newCalledOrder = [...calledOrder];
    if (selectedRecord && !newCalledOrder.includes(selectedRecord.recordId)) {
      newCalledOrder.push(selectedRecord.recordId);
    }

    const newCalledSet = new Set(newCalledOrder);
    let nextRecord: VitalsWorklistItemDto | null = null;

    if (selectedRecord) {
      const currentIndex = currentWorklist.findIndex((item) => item.recordId === selectedRecord.recordId);
      if (currentIndex !== -1) {
        for (let i = currentIndex + 1; i < currentWorklist.length; i++) {
          if (!newCalledSet.has(currentWorklist[i].recordId)) {
            nextRecord = currentWorklist[i];
            break;
          }
        }
        if (!nextRecord) {
          for (let i = 0; i < currentIndex; i++) {
            if (!newCalledSet.has(currentWorklist[i].recordId)) {
              nextRecord = currentWorklist[i];
              break;
            }
          }
        }
      } else {
        nextRecord = currentWorklist.find((item) => !newCalledSet.has(item.recordId)) ?? null;
      }
    } else {
      nextRecord = currentWorklist.find((item) => !newCalledSet.has(item.recordId)) ?? null;
    }

    setCalledOrder(newCalledOrder);
    selectRecordAndResetForm(nextRecord);
  }, [
    hasUnsavedInput,
    isCalling,
    data?.ticketQueue.waitingCount,
    data?.worklist,
    callNext,
    selectedRecord,
    calledOrder,
    selectRecordAndResetForm,
  ]);

  const handleRecall = () => {
    if (calledOrder.length > 1) {
      const firstCalledId = calledOrder[0];
      const firstCalledRecord = worklist.find((item) => item.recordId === firstCalledId);

      let updatedCalledOrder = [...calledOrder];
      if (selectedRecord && selectedRecord.recordId !== firstCalledId) {
        if (!updatedCalledOrder.includes(selectedRecord.recordId)) {
          updatedCalledOrder.push(selectedRecord.recordId);
        }
      }
      const finalCalledOrder = updatedCalledOrder.filter((id) => id !== firstCalledId);

      setCalledOrder(finalCalledOrder);
      selectRecordAndResetForm(firstCalledRecord ?? null);
      return;
    }

    if (activeTicket && !isCalling) {
      recall(activeTicket.id);
    }
  };

  const handleCancel = () => {
    setForm(emptyVitalsForm);
    setAttemptedSave(false);
  };

  const handleSelectRecord = useCallback(
    (item: VitalsWorklistItemDto) => {
      selectRecordAndResetForm(item);
    },
    [selectRecordAndResetForm]
  );

  const handleSave = useCallback(() => {
    if (!activeTicket || !selectedRecord || isSaving) return;
    const missingRequired = !form.pulse || !form.bpSystolic || !form.bpDiastolic || !form.spo2;
    const missingAllergyNote = form.allergyEnabled && !form.allergyNote.trim();
    if (missingRequired || missingAllergyNote) {
      setAttemptedSave(true);
      return;
    }

    saveVitalSigns(
      {
        recordId: selectedRecord.recordId,
        ticketId: activeTicket.id,
        expectedRecordVersion: selectedRecord.version,
        pulse: Number(form.pulse),
        temperatureC: form.temperatureC ? Number(form.temperatureC) : undefined,
        bloodPressureSystolic: Number(form.bpSystolic),
        bloodPressureDiastolic: Number(form.bpDiastolic),
        respiratoryRate: form.respiratoryRate ? Number(form.respiratoryRate) : undefined,
        spo2: Number(form.spo2),
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        allergies: form.allergyEnabled ? form.allergyNote.trim() : '',
      },
      {
        onSuccess: () => {
          if (selectedRecord) {
            setCalledOrder((prev) => prev.filter((id) => id !== selectedRecord.recordId));
          }
          setToast({ type: 'success', message: 'Đã lưu kết quả sinh hiệu thành công!' });
          setForm(emptyVitalsForm);
          setSelectedRecord(null);
          setAttemptedSave(false);
        },
        onError: () => {
          setToast({ type: 'error', message: 'Lưu thất bại, vui lòng thử lại!' });
        },
      }
    );
  }, [activeTicket, selectedRecord, isSaving, form, saveVitalSigns]);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'F2') {
        e.preventDefault();
        handleCallNext();
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleCallNext, handleSave]);

  const stats: StatCard[] = useMemo(() => [
    {
      value: String(statsData?.measuredTodayCount ?? 0),
      label: 'Đã đo hôm nay',
      icon: 'check',
      iconClass: 'bg-green-100 text-[#15803d]',
      delta: statsData?.measuredTodayDelta != null ? `${statsData.measuredTodayDelta >= 0 ? '+' : ''}${statsData.measuredTodayDelta} so hôm qua` : undefined,
    },
    {
      value: String(statsData?.waitingCount ?? 0),
      label: 'Bệnh nhân chờ đo',
      icon: 'clipboard',
      iconClass: 'bg-blue-100 text-[#006096]',
    },
    {
      value: String(statsData?.allergyAlertTodayCount ?? 0),
      label: 'Cảnh báo dị ứng',
      icon: 'alert',
      iconClass: 'bg-red-100 text-[#ba1a1a]',
    },
    {
      value: `${statsData?.avgMinutesPerPatient ?? 0} phút`,
      label: 'Thời gian TB/Bệnh nhân',
      icon: 'activity',
      iconClass: 'bg-teal-100 text-[#006673]',
    },
  ], [statsData]);

  if (isLoading) {
    return <div className="p-8 text-center text-sm font-medium text-[#3f4851]">Đang tải dữ liệu sinh hiệu...</div>;
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={cn(
            'fixed right-6 top-6 z-50 rounded-lg px-4 py-3 text-sm font-bold shadow-lg',
            toast.type === 'success' ? 'bg-green-100 text-[#15803d]' : 'bg-red-100 text-[#ba1a1a]'
          )}
        >
          {toast.message}
        </div>
      )}
      <StatGrid stats={stats} />
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <PatientQueue
          ticketQueue={data?.ticketQueue ?? { currentCalled: null, waitingCount: 0 }}
          worklist={worklist}
          selectedRecordId={selectedRecord?.recordId ?? null}
          calledRecordIds={calledRecordIds}
          hasUnsavedInput={hasUnsavedInput}
          onCallNext={handleCallNext}
          onRecall={handleRecall}
          onSelectRecord={handleSelectRecord}
          isCalling={isCalling}
        />
        <VitalsForm
          selectedRecord={selectedRecord}
          activeTicket={activeTicket}
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
          bmiValue={bmiValue}
          attemptedSave={attemptedSave}
        />
      </div>
    </div>
  );
}

function BarcodeModal({ specimen, onClose }: { specimen: SpecimenDto; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    JsBarcode(canvasRef.current, specimen.specimenCode, {
      format: 'CODE128',
      width: 2,
      height: 70,
      displayValue: true,
      fontSize: 16,
      margin: 10,
    });
  }, [specimen.specimenCode]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `barcode-${specimen.specimenCode}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-sm font-bold text-[#171c1f]">Mã vạch mẫu bệnh phẩm</h3>
        <p className="mb-4 text-xs text-[#3f4851]">
          {specimen.specimenType} — {specimen.patientName} ({specimen.patientCode})
        </p>
        <div className="flex items-center justify-center rounded-lg border border-[#bfc7d2] bg-white p-4">
          <canvas ref={canvasRef} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className={styles.secondaryButton} type="button" onClick={onClose}>
            Đóng
          </button>
          <button className={styles.primaryButton} type="button" onClick={handleDownload}>
            <Icon name="file" />
            Tải về máy
          </button>
        </div>
      </div>
    </div>
  );
}

function SamplesScreen() {
  const { data: specimens = [] } = useSpecimens();
  const collectSpecimenMutation = useCollectSpecimen();
  const printBarcodeMutation = usePrintSpecimenBarcode();
  const handoffSpecimenMutation = useHandoffSpecimen();
  const [barcodeSpecimen, setBarcodeSpecimen] = useState<SpecimenDto | null>(null);

  const [activeTab, setActiveTab] = useState<'collect' | 'handoff'>('collect');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedPatientCode, setSelectedPatientCode] = useState<string | null>(null);

  // Compute stat cards from real data
  const pendingCount = specimens.filter((s) => s.status === 'pending').length;
  const collectedCount = specimens.filter(
    (s) => s.status === 'collected' || s.status === 'handed_over'
  ).length;
  const handoffCount = specimens.filter((s) => s.status === 'collected').length;
  const priorityCount = specimens.filter((s) => s.priority && s.status !== 'handed_over').length;

  const stats: StatCard[] = [
    { value: String(pendingCount), label: 'Chờ lấy mẫu', icon: 'flask', iconClass: 'bg-blue-100 text-[#006096]' },
    { value: String(collectedCount), label: 'Đã lấy mẫu', icon: 'check', iconClass: 'bg-green-100 text-[#15803d]' },
    { value: String(handoffCount), label: 'Chờ bàn giao lab', icon: 'file', iconClass: 'bg-teal-100 text-[#006673]' },
    { value: String(priorityCount), label: 'Mẫu cấp cứu ưu tiên', icon: 'alert', iconClass: 'bg-red-100 text-[#ba1a1a]' },
  ];

  // Filter specimens client-side
  const filteredSpecimens = specimens.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.specimenCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      departmentFilter === 'all' || s.departmentName.toLowerCase().includes(departmentFilter.toLowerCase());
    return matchesSearch && matchesDept;
  });

  const pendingSpecimens = filteredSpecimens.filter((s) => s.status === 'pending');
  const collectedSpecimens = filteredSpecimens.filter((s) => s.status === 'collected');

  // Unique patients in pending list
  const pendingPatientsMap = new Map<string, { patientCode: string; patientName: string; count: number; departmentName: string }>();
  for (const s of pendingSpecimens) {
    const existing = pendingPatientsMap.get(s.patientCode);
    if (existing) {
      existing.count += 1;
    } else {
      pendingPatientsMap.set(s.patientCode, {
        patientCode: s.patientCode,
        patientName: s.patientName,
        count: 1,
        departmentName: s.departmentName,
      });
    }
  }
  const pendingPatientsList = Array.from(pendingPatientsMap.values());

  const activePatientCode =
    selectedPatientCode && pendingPatientsMap.has(selectedPatientCode)
      ? selectedPatientCode
      : pendingPatientsList[0]?.patientCode || null;

  const activePatientSpecimens = activePatientCode
    ? pendingSpecimens.filter((s) => s.patientCode === activePatientCode)
    : pendingSpecimens;

  const selectedPatientInfo = activePatientSpecimens[0];

  return (
    <div className="space-y-5">
      <StatGrid stats={stats} />
      <section className={cn(styles.card, 'overflow-hidden')}>
        <div className="flex border-b border-[#bfc7d2] bg-[#f0f4f8]">
          <button
            className={cn(
              'px-6 py-3 text-sm font-medium transition-colors',
              activeTab === 'collect'
                ? 'border-b-2 border-[#006096] text-[#006096]'
                : 'text-[#3f4851] hover:text-[#171c1f]'
            )}
            type="button"
            onClick={() => setActiveTab('collect')}
          >
            1. Lấy mẫu bệnh phẩm ({pendingCount})
          </button>
          <button
            className={cn(
              'px-6 py-3 text-sm font-medium transition-colors',
              activeTab === 'handoff'
                ? 'border-b-2 border-[#006096] text-[#006096]'
                : 'text-[#3f4851] hover:text-[#171c1f]'
            )}
            type="button"
            onClick={() => setActiveTab('handoff')}
          >
            2. Phiếu bàn giao mẫu (Phòng Lab) ({handoffCount})
          </button>
        </div>

        {activeTab === 'collect' ? (
          <div className="grid min-h-[620px] lg:grid-cols-[288px_minmax(0,1fr)]">
            <aside className="border-r border-[#bfc7d2]">
              <div className="flex gap-2 border-b border-[#bfc7d2] bg-[#f0f4f8] p-3">
                <select
                  className={cn(styles.input, 'h-9 text-xs')}
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">Tất cả khoa</option>
                  <option value="Khoa Da Liễu">Khoa Da Liễu</option>
                </select>
                <label className="relative flex-1">
                  <span className="sr-only">Tìm bệnh nhân</span>
                  <Icon
                    className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#3f4851]"
                    name="search"
                  />
                  <input
                    className={cn(styles.input, 'h-9 pl-8 text-xs')}
                    placeholder="Tên, mã..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </label>
              </div>
              <p className="bg-[#f0f4f8]/70 px-4 py-2 text-xs font-bold uppercase leading-4 tracking-[0.4px] text-[#3f4851]">
                Bệnh nhân chờ lấy mẫu ({pendingPatientsList.length})
              </p>
              {pendingPatientsList.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#3f4851]">Không có bệnh nhân nào chờ lấy mẫu</div>
              ) : (
                pendingPatientsList.map((patient, index) => (
                  <button
                    className={cn(
                      'flex w-full items-center gap-3 border-b border-[#eaeef2] p-4 text-left transition-colors',
                      patient.patientCode === activePatientCode && 'border-l-4 border-l-[#006096] bg-indigo-50'
                    )}
                    key={patient.patientCode}
                    type="button"
                    onClick={() => setSelectedPatientCode(patient.patientCode)}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-sm text-sm font-bold text-white',
                        index % 2 === 1 ? 'bg-green-600' : 'bg-[#006096]'
                      )}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold uppercase text-[#171c1f]">
                        {patient.patientName}
                      </span>
                      <span className="block text-xs text-[#3f4851]">Mã: {patient.patientCode}</span>
                      <span className="block text-xs font-semibold text-[#006096]">
                        {patient.count} mẫu bệnh phẩm
                      </span>
                    </span>
                  </button>
                ))
              )}
            </aside>
            <div className="min-w-0">
              {selectedPatientInfo ? (
                <div className="flex flex-wrap justify-between gap-3 border-b border-[#bfc7d2] p-4">
                  <div>
                    <h2 className="text-lg font-bold leading-7 text-[#171c1f]">{selectedPatientInfo.patientName}</h2>
                    <p className="text-xs leading-5 text-[#3f4851]">
                      Mã BN: {selectedPatientInfo.patientCode} • Khoa: {selectedPatientInfo.departmentName}
                    </p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-xs font-medium leading-4 text-[#3f4851]">Số mẫu chờ lấy:</p>
                    <p className="text-sm font-bold leading-5 text-[#006096]">
                      {activePatientSpecimens.length} mẫu bệnh phẩm
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border-b border-[#bfc7d2] p-4 text-sm text-[#3f4851]">
                  Chọn bệnh nhân ở danh sách bên trái để xem yêu cầu lấy mẫu
                </div>
              )}
              <div className="space-y-4 p-4">
                {activePatientSpecimens.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[#3f4851]">
                    Đã hoàn thành lấy tất cả mẫu cho bệnh nhân này!
                  </div>
                ) : (
                  activePatientSpecimens.map((order) => (
                    <article
                      className={cn(
                        'overflow-hidden rounded-lg border border-[#bfc7d2] shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
                        order.priority && 'border-l-4 border-l-[#ba1a1a]'
                      )}
                      key={order.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#bfc7d2] bg-[#f0f4f8] px-4 py-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-sm bg-[#e4e9ed] px-2 py-0.5 text-xs font-bold text-[#3f4851]">
                            {order.specimenCode}
                          </span>
                          <span className="text-xs font-bold uppercase text-[#006673]">
                            {order.specimenType}
                          </span>
                          {order.priority && (
                            <span className="rounded-sm bg-red-100 px-2 py-0.5 text-xs font-bold text-[#ba1a1a]">
                              ƯU TIÊN CẤP CỨU
                            </span>
                          )}
                          {order.barcodePrinted && (
                            <span className="rounded-sm bg-blue-100 px-2 py-0.5 text-xs font-semibold text-[#006096]">
                              ✓ Đã in mã vạch
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold uppercase text-[#3f4851]">Chờ lấy mẫu</span>
                      </div>
                      <div className="space-y-2 px-4 py-4">
                        <h3 className="text-base font-bold leading-6 text-[#006096]">{order.orderDescription}</h3>
                        <p className="text-xs leading-5 text-[#3f4851]">
                          Bệnh nhân: <strong className="text-[#171c1f]">{order.patientName} ({order.patientCode})</strong> • Khoa: <strong className="text-[#171c1f]">{order.departmentName}</strong>
                        </p>
                        <div className="flex flex-wrap justify-end gap-3 pt-3">
                          <button
                            className={styles.primaryButton}
                            type="button"
                            disabled={printBarcodeMutation.isPending}
                            onClick={() => {
                              printBarcodeMutation.mutate({ id: order.id });
                              setBarcodeSpecimen(order);
                            }}
                          >
                            {order.barcodePrinted ? 'In lại mã vạch' : 'In mã vạch (Barcode)'}
                          </button>
                          <button
                            className={styles.primaryButton}
                            type="button"
                            disabled={collectSpecimenMutation.isPending}
                            onClick={() => collectSpecimenMutation.mutate({ id: order.id })}
                          >
                            Tiến hành lấy mẫu
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#bfc7d2] pb-3">
              <div>
                <h2 className="text-lg font-bold leading-7 text-[#171c1f]">Danh sách mẫu đã lấy — Chờ bàn giao Phòng Lab</h2>
                <p className="text-xs text-[#3f4851]">Các mẫu bệnh phẩm đã được lấy thành công, sẵn sàng bàn giao sang kỹ thuật viên phòng xét nghiệm</p>
              </div>
              <span className="rounded-sm bg-teal-100 px-3 py-1 text-xs font-bold text-[#006673]">
                {collectedSpecimens.length} mẫu chờ bàn giao
              </span>
            </div>

            {collectedSpecimens.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#3f4851]">
                Chưa có mẫu bệnh phẩm nào đã lấy chờ bàn giao.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {collectedSpecimens.map((spec) => (
                  <article
                    className="overflow-hidden rounded-lg border border-[#bfc7d2] bg-white p-4 shadow-sm space-y-3"
                    key={spec.id}
                  >
                    <div className="flex items-center justify-between border-b border-[#eaeef2] pb-2">
                      <span className="rounded bg-[#e4e9ed] px-2 py-0.5 text-xs font-bold text-[#171c1f]">
                        {spec.specimenCode}
                      </span>
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-[#15803d]">
                        ✓ Đã lấy thành công
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#006096]">{spec.orderDescription}</h3>
                      <p className="text-xs text-[#3f4851] font-medium">Loại mẫu: {spec.specimenType}</p>
                      <p className="text-xs text-[#3f4851]">
                        Bệnh nhân: <strong>{spec.patientName}</strong> ({spec.patientCode})
                      </p>
                      <p className="text-xs text-[#3f4851]">
                        Thời gian lấy: {spec.collectedAt ? new Date(spec.collectedAt).toLocaleTimeString('vi-VN') + ' - ' + new Date(spec.collectedAt).toLocaleDateString('vi-VN') : '—'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#eaeef2]">
                      <span className="text-xs text-[#3f4851]">
                        KTV tiếp nhận: <span className="font-semibold text-[#171c1f]">Phòng Lab Central</span>
                      </span>
                      <button
                        className={styles.primaryButton}
                        type="button"
                        disabled={handoffSpecimenMutation.isPending}
                        onClick={() => handoffSpecimenMutation.mutate({ id: spec.id, labReceiverName: 'Phòng Lab Central' })}
                      >
                        Bàn giao cho Lab
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {barcodeSpecimen && (
        <BarcodeModal specimen={barcodeSpecimen} onClose={() => setBarcodeSpecimen(null)} />
      )}
    </div>
  );
}

function BedCard({
  bed,
  selectedRecordId,
  isEmergency,
  allBeds,
  waitingPatients,
  transferSourceBedId,
  onStartTransfer,
  onSelectTransferTarget,
  isChanging,
}: {
  bed: BedDto;
  selectedRecordId: string;
  isEmergency: boolean;
  allBeds: BedDto[];
  waitingPatients: AdmissionBoardDto[];
  transferSourceBedId: string | null;
  onStartTransfer: (bedId: string) => void;
  onSelectTransferTarget: (bed: BedDto) => void;
  isChanging: boolean;
}) {
  const { mutate: processDischarge, isPending: isDischarging } = useProcessDischarge();
  const { mutate: assignBed, isPending: isAssigning } = useAssignBed();
  const [showRecordModal, setShowRecordModal] = useState(false);

  if (bed.status === 'available' || bed.status === 'empty') {
    return (
      <article className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-[#bfc7d2] bg-white p-6 text-center shadow-sm">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#e4e9ed] text-[#bfc7d2]">
          <Icon name="bed" />
        </div>
        <p className="mb-4 text-xs font-medium text-[#707882]">Giường {bed.bed} - Trống</p>
        <button
          className={styles.primaryButton}
          type="button"
          disabled={isAssigning}
          onClick={() => {
            if (transferSourceBedId) {
              onSelectTransferTarget(bed);
              return;
            }
            if (!selectedRecordId) {
              alert('Vui lòng chọn hồ sơ bệnh nhân chờ giường ở thanh công cụ phía trên trước!');
              return;
            }
            const patient = waitingPatients.find((p) => p.recordId === selectedRecordId);
            if (patient?.version === undefined || patient?.version === null) {
              alert('Không tìm thấy phiên bản hồ sơ bệnh án hợp lệ!');
              return;
            }
            assignBed({ recordId: selectedRecordId, bedId: bed.id, expectedRecordVersion: patient.version });
          }}
        >
          {transferSourceBedId
            ? `Chuyển vào giường ${bed.bed}`
            : isAssigning
              ? 'Đang xếp...'
              : 'Tiếp nhận bệnh nhân'}
        </button>
      </article>
    );
  }

  const effectiveStatus = isEmergency ? 'emergency' : bed.status;

  const tone =
    effectiveStatus === 'emergency'
      ? 'border-[#ba1a1a] shadow-md ring-2 ring-red-500/20'
      : effectiveStatus === 'discharge'
        ? 'border-[#22c55e]'
        : 'border-[#006096]';
  const dotClass =
    effectiveStatus === 'emergency'
      ? 'bg-[#ba1a1a]'
      : effectiveStatus === 'discharge'
        ? 'bg-[#22c55e]'
        : 'bg-[#006096]';

  return (
    <>
      <article className={cn('overflow-hidden rounded-xl border bg-white shadow-sm transition-all', tone)}>
        <div className="flex items-center justify-between gap-2 border-b border-[#eaeef2] p-3">
          <p className="text-xs font-bold leading-5 text-[#171c1f]">Giường {bed.bed}</p>
          <div className="flex items-center gap-2">
            {bed.allergy && (
              <span className="rounded-sm bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#ba1a1a]">
                Dị ứng
              </span>
            )}
            {effectiveStatus === 'emergency' && (
              <span className="rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white animate-pulse">
                CẤP CỨU
              </span>
            )}
            {effectiveStatus === 'discharge' && (
              <span className="rounded-sm bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#15803d]">
                CHỜ XUẤT VIỆN
              </span>
            )}
            <span className={cn('h-2 w-2 rounded-full', dotClass)} />
          </div>
        </div>
        <div className="space-y-2 p-4">
          <h3 className="text-sm font-bold uppercase leading-5 text-[#171c1f]">{bed.patient}</h3>
          <p className="text-xs leading-4 text-[#3f4851]">{bed.meta}</p>
          <p className="min-h-8 text-xs leading-4 text-[#3f4851]">{bed.diagnosis}</p>
          <p className="flex items-center gap-1 text-xs font-semibold leading-4 text-[#006096]">
            <Icon className="h-3.5 w-3.5" name="user" />
            BS. Điều trị phụ trách
          </p>
        </div>
        <div className="flex flex-wrap gap-1 border-t border-[#eaeef2] bg-[#f0f4f8] p-2">
          <button
            className={cn(
              styles.secondaryButton,
              'h-8 px-2 text-[10px]',
              transferSourceBedId === bed.id && 'border-[#006096] bg-sky-50 text-[#006096] font-bold'
            )}
            type="button"
            disabled={
              isChanging ||
              !bed.recordId ||
              (transferSourceBedId !== null && transferSourceBedId !== bed.id)
            }
            onClick={() => onStartTransfer(bed.id)}
          >
            {isChanging
              ? 'Đang chuyển...'
              : transferSourceBedId === bed.id
                ? 'Đang chọn giường đích...'
                : 'Chuyển'}
          </button>
          <button
            className={cn(styles.secondaryButton, 'h-8 px-2 text-[10px]')}
            type="button"
            onClick={() => setShowRecordModal(true)}
          >
            Bệnh án
          </button>
          <button
            className={cn(
              effectiveStatus === 'discharge'
                ? 'bg-green-600 text-white hover:bg-green-700 font-bold'
                : 'opacity-50',
              styles.secondaryButton,
              'h-8 px-2 text-[10px]'
            )}
            type="button"
            disabled={effectiveStatus !== 'discharge' || isDischarging || !bed.recordId}
            onClick={() => {
              if (bed.recordId && bed.recordVersion !== null && bed.recordVersion !== undefined) {
                processDischarge({ recordId: bed.recordId, expectedRecordVersion: bed.recordVersion });
              } else {
                alert('Thông tin phiên bản hồ sơ không hợp lệ!');
              }
            }}
          >
            {isDischarging ? 'Đang...' : effectiveStatus === 'discharge' ? 'Hoàn tất' : 'Xuất'}
          </button>
        </div>
      </article>
      {showRecordModal && <MedicalRecordModal bed={bed} onClose={() => setShowRecordModal(false)} />}
    </>
  );
}

function TransferReasonModal({
  sourceBed,
  targetBed,
  isPending,
  onCancel,
  onConfirm,
}: {
  sourceBed: BedDto;
  targetBed: BedDto;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const trimmedLen = reason.trim().length;
  const isValid = trimmedLen >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-sm font-bold text-[#171c1f]">Xác nhận chuyển giường</h3>
        <p className="mb-4 text-xs text-[#3f4851]">
          Từ giường <strong>{sourceBed.bed}</strong> ({sourceBed.patient}) sang giường{' '}
          <strong>{targetBed.bed}</strong>
        </p>
        <label className="mb-1 block text-xs font-semibold text-[#171c1f]">
          Lý do chuyển giường (tối thiểu 10 ký tự)
        </label>
        <textarea
          className={cn(styles.input, 'h-24 w-full text-xs')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Nhập lý do chuyển giường..."
          autoFocus
        />
        {!isValid && reason.length > 0 && (
          <p className="mt-1 text-[10px] text-red-600">Lý do cần tối thiểu 10 ký tự (hiện {trimmedLen}).</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button className={styles.secondaryButton} type="button" onClick={onCancel} disabled={isPending}>
            Hủy
          </button>
          <button
            className={styles.primaryButton}
            type="button"
            disabled={!isValid || isPending}
            onClick={() => onConfirm(reason.trim())}
          >
            {isPending ? 'Đang chuyển...' : 'Xác nhận chuyển'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MedicalRecordModal({ bed, onClose }: { bed: BedDto; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#171c1f]">Thông tin bệnh án</h3>
          {bed.allergy && (
            <span className="rounded-sm bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#ba1a1a]">
              Dị ứng
            </span>
          )}
        </div>
        <dl className="space-y-3 text-xs">
          <div>
            <dt className="font-semibold text-[#3f4851]">Bệnh nhân</dt>
            <dd className="text-[#171c1f]">{bed.patient || '—'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#3f4851]">Giường</dt>
            <dd className="text-[#171c1f]">{bed.roomName} — Giường {bed.bed}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#3f4851]">Thông tin hồ sơ</dt>
            <dd className="text-[#171c1f]">{bed.meta || '—'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#3f4851]">Chẩn đoán</dt>
            <dd className="text-[#171c1f]">{bed.diagnosis || '—'}</dd>
          </div>
        </dl>
        <div className="mt-5 flex justify-end">
          <button className={styles.secondaryButton} type="button" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

type BedFilterStatus = 'available' | 'occupied' | 'emergency' | 'discharge' | 'maintenance';

const BED_STATUS_LABELS: Record<BedFilterStatus, string> = {
  available: 'Trống',
  occupied: 'Đang dùng',
  emergency: 'Cấp cứu',
  discharge: 'Chờ xuất viện',
  maintenance: 'Bảo trì',
};

function normalizeBedStatus(bed: BedDto, isEmergencyOverlay: boolean): BedFilterStatus {
  if (isEmergencyOverlay || bed.status === 'emergency') return 'emergency';
  if (bed.status === 'available' || bed.status === 'empty') return 'available';
  if (bed.status === 'maintenance') return 'maintenance';
  if (bed.status === 'discharge') return 'discharge';
  return 'occupied';
}

function BedsScreen() {
  const { data: apiBeds, isLoading } = useBeds();
  const { data: admissionBoard } = useAdmissionBoard();
  const { mutate: changeBed, isPending: isChanging } = useChangeBedAssignment();

  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [selectedEmergencyBedId, setSelectedEmergencyBedId] = useState<string>('');
  const [emergencyBedIds, setEmergencyBedIds] = useState<string[]>([]);
  const [transferSourceBedId, setTransferSourceBedId] = useState<string | null>(null);
  const [transferTargetBed, setTransferTargetBed] = useState<BedDto | null>(null);
  const [roomFilter, setRoomFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const bedsList: BedDto[] = apiBeds || [];
  const waitingPatients = admissionBoard || [];
  const sourceBedForModal = bedsList.find((b) => b.id === transferSourceBedId) ?? null;

  if (isLoading) {
    return <div className="p-8 text-center text-[#3f4851]">Đang tải dữ liệu buồng giường...</div>;
  }

  const totalBeds = bedsList.length;
  const occupiedCount = bedsList.filter((b) => b.status === 'occupied').length;
  const availableCount = bedsList.filter((b) => b.status === 'available').length;
  const dischargeCount = bedsList.filter((b) => b.status === 'discharge').length;
  const occupiedPercent = totalBeds > 0 ? Math.round((occupiedCount / totalBeds) * 100) : 0;

  const stats: StatCard[] = [
    { value: totalBeds.toString(), label: 'Tổng số giường', icon: 'bed', iconClass: 'bg-indigo-50 text-[#006096]' },
    {
      value: occupiedCount.toString(),
      label: `Đang sử dụng (${occupiedPercent}%)`,
      icon: 'activity',
      iconClass: 'bg-yellow-50 text-[#ea580c]',
    },
    {
      value: availableCount.toString(),
      label: 'Giường trống',
      icon: 'check',
      iconClass: 'bg-sky-100 text-[#15803d]',
      valueClass: 'text-[#15803d]',
    },
    {
      value: dischargeCount.toString(),
      label: 'Chờ xuất viện',
      icon: 'file',
      iconClass: 'bg-slate-100 text-[#3f4851]',
      valueClass: 'text-[#006096]',
    },
  ];

  const roomOptions = Array.from(new Set(bedsList.map((b) => b.roomName))).sort();
  const statusOptions = Array.from(
    new Set(bedsList.map((b) => normalizeBedStatus(b, emergencyBedIds.includes(b.id))))
  );

  const filteredBedsList = bedsList.filter((b) => {
    const matchesRoom = roomFilter === 'all' || b.roomName === roomFilter;
    const matchesStatus =
      statusFilter === 'all' || normalizeBedStatus(b, emergencyBedIds.includes(b.id)) === statusFilter;
    return matchesRoom && matchesStatus;
  });

  const rooms = filteredBedsList.reduce((acc: Record<string, BedDto[]>, bed: BedDto) => {
    if (!acc[bed.roomName]) acc[bed.roomName] = [];
    acc[bed.roomName].push(bed);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <StatGrid stats={stats} />

      {/* Action bar - Part B controls */}
      <div className="rounded-xl border border-[#bfc7d2] bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-4 items-center justify-between border-b border-[#eaeef2] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#171c1f]">Tiếp nhận bệnh nhân chờ giường:</span>
            <select
              className={cn(styles.input, 'w-80 text-xs')}
              value={selectedRecordId}
              onChange={(e) => setSelectedRecordId(e.target.value)}
            >
              <option value="">-- Chọn bệnh nhân chờ xếp giường ({waitingPatients.length}) --</option>
              {waitingPatients.map((p) => (
                <option key={p.recordId} value={p.recordId}>
                  {p.patientName} ({p.gender}, {p.age}t) - BA: {p.recordCode} - {p.diagnosis}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#171c1f]">Đánh dấu Cấp cứu:</span>
            <select
              className={cn(styles.input, 'w-48 text-xs')}
              value={selectedEmergencyBedId}
              onChange={(e) => setSelectedEmergencyBedId(e.target.value)}
            >
              <option value="">-- Chọn giường --</option>
              {bedsList.map((b) => (
                <option key={b.id} value={b.id}>
                  Giường {b.bed} ({b.patient || 'Trống'})
                </option>
              ))}
            </select>
            <button
              className={cn(
                styles.secondaryButton,
                'whitespace-nowrap text-red-600 border-red-300 hover:bg-red-50 text-xs h-9 px-3'
              )}
              type="button"
              disabled={!selectedEmergencyBedId}
              onClick={() => {
                if (selectedEmergencyBedId) {
                  setEmergencyBedIds((prev) =>
                    prev.includes(selectedEmergencyBedId)
                      ? prev.filter((id) => id !== selectedEmergencyBedId)
                      : [...prev, selectedEmergencyBedId]
                  );
                }
              }}
            >
              {emergencyBedIds.includes(selectedEmergencyBedId) ? 'Bỏ Cấp cứu' : 'Đánh dấu Cấp cứu'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-4 pt-1">
          <div className="flex flex-wrap gap-3">
            <select
              className={cn(styles.input, 'w-36 text-xs')}
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
            >
              <option value="all">Tất cả buồng</option>
              {roomOptions.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
            <select
              className={cn(styles.input, 'w-40 text-xs')}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {BED_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {[
              ['bg-[#bfc7d2]', 'Trống'],
              ['bg-[#006096]', 'Đang dùng'],
              ['bg-[#ba1a1a]', 'Cấp cứu'],
              ['bg-[#22c55e]', 'Chờ xuất viện'],
            ].map(([color, label]) => (
              <span
                className="inline-flex items-center gap-2 text-xs font-medium text-[#3f4851]"
                key={label}
              >
                <span className={cn('h-2.5 w-2.5 rounded-full', color)} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {transferSourceBedId && (
        <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs text-[#006096]">
          <div>
            <span className="font-bold">
              Đang chuyển bệnh nhân từ giường {bedsList.find((b) => b.id === transferSourceBedId)?.bed ?? ''}
            </span>{' '}
            — chọn giường trống bên dưới để chuyển đến.
            {bedsList.filter((b) => b.status === 'available').length === 0 && (
              <span className="ml-2 font-semibold text-red-600">
                (Không có giường trống nào để chuyển đến)
              </span>
            )}
          </div>
          <button
            className={cn(styles.secondaryButton, 'h-7 px-3 text-xs')}
            type="button"
            onClick={() => setTransferSourceBedId(null)}
          >
            Hủy
          </button>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(rooms).map(([roomName, roomBeds]) => (
          <section key={roomName}>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[1px] text-[#707882]">
              {roomName}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {roomBeds.map((bed) => (
                <BedCard
                  bed={bed}
                  key={bed.id}
                  selectedRecordId={selectedRecordId}
                  isEmergency={emergencyBedIds.includes(bed.id)}
                  allBeds={bedsList}
                  waitingPatients={waitingPatients}
                  transferSourceBedId={transferSourceBedId}
                  onStartTransfer={(bedId) => setTransferSourceBedId(bedId)}
                  onSelectTransferTarget={(targetBed) => setTransferTargetBed(targetBed)}
                  isChanging={isChanging}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {transferTargetBed && sourceBedForModal && (
        <TransferReasonModal
          sourceBed={sourceBedForModal}
          targetBed={transferTargetBed}
          isPending={isChanging}
          onCancel={() => setTransferTargetBed(null)}
          onConfirm={(reason) => {
            if (sourceBedForModal.recordId && sourceBedForModal.recordVersion != null) {
              changeBed(
                {
                  recordId: sourceBedForModal.recordId,
                  targetBedId: transferTargetBed.id,
                  action: 'transfer',
                  reason,
                  expectedRecordVersion: sourceBedForModal.recordVersion,
                },
                {
                  onSuccess: () => {
                    setTransferTargetBed(null);
                    setTransferSourceBedId(null);
                  },
                }
              );
            }
          }}
        />
      )}
    </div>
  );
}

function CancelOrderModal({
  isPending,
  onCancel,
  onConfirm,
}: {
  isPending: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [attemptedConfirm, setAttemptedConfirm] = useState(false);
  const isValid = reason.trim().length > 0;
  const showError = attemptedConfirm && !isValid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-sm font-bold text-[#171c1f]">Hủy y lệnh</h3>
        <label className="mb-1 block text-xs font-semibold text-[#171c1f]">Lý do hủy</label>
        <textarea
          className={cn(
            styles.input,
            'h-24 w-full text-xs',
            showError && 'border-red-500 ring-2 ring-red-500/30 focus:border-red-500 focus:ring-red-500/30'
          )}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Nhập lý do hủy y lệnh..."
          autoFocus
        />
        {showError && (
          <p className="mt-1 text-xs font-bold text-red-600">
            BẮT BUỘC NHẬP LÝ DO HỦY Y LỆNH
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button className={styles.secondaryButton} type="button" onClick={onCancel} disabled={isPending}>
            Đóng
          </button>
          <button
            className={cn(styles.primaryButton, 'bg-red-600 hover:bg-red-700')}
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!isValid) {
                setAttemptedConfirm(true);
                return;
              }
              onConfirm(reason.trim());
            }}
          >
            {isPending ? 'Đang hủy...' : 'Xác nhận hủy y lệnh'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderStatus({ order }: { order: OrderDto }) {
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus();
  const [showCancelModal, setShowCancelModal] = useState(false);

  if (order.status === 'done') {
    return (
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
          <Icon className="h-4 w-4" name="check" />
        </span>
        <span>
          <span className="block text-xs font-bold text-[#15803d]">Đã thực hiện</span>
          <span className="block text-[10px] font-medium text-[#3f4851]">
            Bởi ĐD Nguyễn Thị Hương
          </span>
        </span>
      </div>
    );
  }

  if (order.status === 'cancelled') {
    return (
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-100 text-red-600">
          <Icon name="alert" />
        </span>
        <span>
          <span className="block text-xs font-bold text-red-700">Đã hủy</span>
        </span>
      </div>
    );
  }

  if (order.status === 'blocked') {
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

  if (order.status === 'delayed') {
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
      <label className="flex items-start gap-2 text-xs font-semibold leading-4 text-[#3f4851]">
        <input className="mt-0.5 h-4 w-4 rounded border-[#bfc7d2]" type="checkbox" />
        Đã test da – Kết quả: ÂM TÍNH
      </label>
      <button
        className={styles.primaryButton}
        type="button"
        disabled={isPending}
        onClick={() => updateStatus({ orderId: order.id, status: 'done' })}
      >
        {isPending ? 'Đang xử lý...' : 'Xác nhận thực hiện'}
      </button>
      <button
        className={styles.secondaryButton}
        type="button"
        disabled={isPending}
        onClick={() => setShowCancelModal(true)}
      >
        Hủy y lệnh
      </button>

      {showCancelModal && (
        <CancelOrderModal
          isPending={isPending}
          onCancel={() => setShowCancelModal(false)}
          onConfirm={(reason) => {
            updateStatus(
              { orderId: order.id, status: 'cancelled', cancelReason: reason },
              { onSuccess: () => setShowCancelModal(false) }
            );
          }}
        />
      )}
    </div>
  );
}

function getOrderShift(iso: string): 'Sáng' | 'Chiều' | 'Tối' {
  const hour = new Date(iso).getHours();
  if (hour >= 6 && hour < 14) return 'Sáng';
  if (hour >= 14 && hour < 22) return 'Chiều';
  return 'Tối';
}

function OrdersScreen() {
  const { data: apiOrders, isLoading } = useOrders();
  const ordersList: OrderDto[] = apiOrders || [];

  const [roomFilter, setRoomFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return <div className="p-8 text-center text-[#3f4851]">Đang tải dữ liệu y lệnh...</div>;
  }

  const pendingCount = ordersList.filter(o => o.status === 'active' || o.status === 'pending').length;
  const doneCount = ordersList.filter(o => o.status === 'done').length;
  const cancelledCount = ordersList.filter(o => o.status === 'cancelled').length;
  const allergyCount = ordersList.filter(o => o.hasAllergyWarning).length;

  const stats: StatCard[] = [
    {
      value: pendingCount.toString(),
      label: 'Chờ thực hiện',
      icon: 'activity',
      iconClass: 'bg-orange-50 text-[#ea580c]',
      valueClass: 'text-orange-700',
    },
    {
      value: doneCount.toString(),
      label: 'Đã thực hiện hôm nay',
      icon: 'check',
      iconClass: 'bg-green-50 text-[#16a34a]',
      valueClass: 'text-green-700',
    },
    {
      value: cancelledCount.toString(),
      label: 'Đã hủy',
      icon: 'alert',
      iconClass: 'bg-red-50 text-[#ba1a1a]',
      valueClass: 'text-red-700',
    },
    {
      value: allergyCount.toString(),
      label: 'Cảnh báo dị ứng thuốc',
      icon: 'shield',
      iconClass: 'bg-red-100 text-[#ba1a1a]',
      valueClass: 'text-red-700',
    },
  ];

  const roomOptions = Array.from(new Set(ordersList.map(o => o.roomLabel))).sort();

  const filteredOrders = ordersList.filter((order) => {
    const matchesRoom = roomFilter === 'all' || order.roomLabel === roomFilter;
    const matchesShift = shiftFilter === 'all' || getOrderShift(order.time) === shiftFilter;
    const matchesType = typeFilter === 'all' || order.orderType === typeFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      order.patientName.toLowerCase().includes(q) ||
      order.title.toLowerCase().includes(q) ||
      order.instruction.toLowerCase().includes(q);
    return matchesRoom && matchesShift && matchesType && matchesSearch;
  });

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
        <div className="flex flex-wrap gap-3 border-b border-[#eaeef2] bg-[#f0f4f8]/60 p-4">
          <select
            className={cn(styles.input, 'w-36 text-xs')}
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="all">Tất cả buồng</option>
            {roomOptions.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
          <select
            className={cn(styles.input, 'w-28 text-xs')}
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
          >
            <option value="all">Tất cả ca</option>
            <option value="Sáng">Ca sáng</option>
            <option value="Chiều">Ca chiều</option>
            <option value="Tối">Ca tối</option>
          </select>
          <select
            className={cn(styles.input, 'w-32 text-xs')}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Tất cả loại</option>
            {Object.entries(orderTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="relative min-w-[240px] flex-1">
            <span className="sr-only">Tìm y lệnh</span>
            <Icon
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#707882]"
              name="search"
            />
            <input
              className={cn(styles.input, 'pl-9 text-xs')}
              placeholder="Tìm tên thuốc, bệnh nhân..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              {filteredOrders.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-sm text-[#3f4851]" colSpan={5}>
                    Không tìm thấy y lệnh phù hợp bộ lọc
                  </td>
                </tr>
              )}
              {filteredOrders.map((order) => (
                <tr
                  className={cn(order.status === 'blocked' && 'bg-red-50/30')}
                  key={order.id}
                >
                  <td className={styles.td}>
                    <p
                      className={cn(
                        'text-base font-bold',
                        order.status === 'pending' || order.status === 'active' ? 'text-[#006096]' : 'text-[#171c1f]',
                      )}
                    >
                      {new Date(order.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className={styles.td}>
                    <p className="text-sm font-bold uppercase leading-5 text-[#171c1f]">
                      {order.patientName}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#3f4851]">{order.roomLabel}</p>
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
                        order.status === 'blocked' ? 'text-red-700' : 'text-[#171c1f]',
                      )}
                    >
                      {order.title}
                    </p>
                    <span className="mt-1 inline-flex rounded-sm bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      「ĐÃ KÝ」 BS. T.V.Khoa
                    </span>
                    <p className="mt-1 text-xs font-medium text-[#3f4851]">{order.instruction}</p>
                  </td>
                  <td className={styles.td}>
                    <p
                      className={cn(
                        'text-xs leading-4',
                        order.status === 'blocked' ? 'font-bold text-red-600' : 'text-[#3f4851]',
                      )}
                    >
                      {order.note}
                    </p>
                  </td>
                  <td className={cn(styles.td, 'min-w-56')}>
                    <OrderStatus order={order} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

type EmergencyIdentityFormState = {
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  phoneNumber: string;
  identityCardNumber: string;
  address: string;
  healthInsuranceCode: string;
  guardianFullName: string;
  privacyConfirmed: boolean;
};

const emptyEmergencyForm: EmergencyIdentityFormState = {
  fullName: '',
  dateOfBirth: '',
  gender: 'male',
  phoneNumber: '',
  identityCardNumber: '',
  address: '',
  healthInsuranceCode: '',
  guardianFullName: '',
  privacyConfirmed: false,
};

function formatAdmittedAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleTimeString('vi-VN')} - ${d.toLocaleDateString('vi-VN')}`;
}

function EmergencyScreen() {
  const { data: unidentifiedPatients, isLoading } = useUnidentifiedEmergencyPatients();
  const { mutate: standardizeIdentity, isPending } = useStandardizeEmergencyIdentity();

  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [form, setForm] = useState<EmergencyIdentityFormState>(emptyEmergencyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const patients = useMemo(() => unidentifiedPatients ?? [], [unidentifiedPatients]);

  useEffect(() => {
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].patientId);
    }
  }, [patients, selectedPatientId]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const selectedPatient = patients.find((p) => p.patientId === selectedPatientId) ?? null;

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setForm(emptyEmergencyForm);
    setErrors({});
  };

  const handleReset = () => {
    setForm(emptyEmergencyForm);
    setErrors({});
  };

  const handleSubmit = () => {
    if (!selectedPatient || isPending) return;

    const nextErrors: Record<string, string> = {};
    if (form.fullName.trim().length < 3) nextErrors.fullName = 'Họ và tên tối thiểu 3 ký tự';
    if (!form.dateOfBirth) nextErrors.dateOfBirth = 'Vui lòng nhập ngày sinh';
    else if (new Date(form.dateOfBirth) > new Date())
      nextErrors.dateOfBirth = 'Ngày sinh không được ở tương lai';
    if (!/^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-9])[0-9]{7}$/.test(form.phoneNumber))
      nextErrors.phoneNumber = 'Số điện thoại không đúng định dạng di động Việt Nam hợp lệ (VD: 09xxxxxxxx, 03xxxxxxxx)';
    if (!/^\d{12}$/.test(form.identityCardNumber))
      nextErrors.identityCardNumber = 'Số CCCD phải gồm đúng 12 chữ số';
    if (!form.guardianFullName.trim())
      nextErrors.guardianFullName = 'Vui lòng nhập họ tên người bảo hộ / liên hệ';
    if (!form.privacyConfirmed)
      nextErrors.privacyConfirmed = 'Cần xác nhận đồng ý trước khi gửi';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    standardizeIdentity(
      {
        patientId: selectedPatient.patientId,
        fullName: form.fullName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        phoneNumber: form.phoneNumber,
        identityCardNumber: form.identityCardNumber,
        address: form.address.trim() || undefined,
        healthInsuranceCode: form.healthInsuranceCode.trim() || undefined,
        guardianFullName: form.guardianFullName.trim(),
        privacyConfirmed: true,
      },
      {
        onSuccess: () => {
          setToast({ type: 'success', message: 'Đã chuẩn hóa danh tính bệnh nhân thành công!' });
          setForm(emptyEmergencyForm);
          setErrors({});
          setSelectedPatientId('');
        },
        onError: (err: any) => {
          setToast({
            type: 'error',
            message: err?.error?.message || 'Chuẩn hóa danh tính thất bại, vui lòng thử lại!',
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm font-medium text-[#3f4851]">
        Đang tải danh sách ca cấp cứu vô danh...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={cn(
            'fixed right-6 top-6 z-50 rounded-lg px-4 py-3 text-sm font-bold shadow-lg',
            toast.type === 'success' ? 'bg-green-100 text-[#15803d]' : 'bg-red-100 text-[#ba1a1a]'
          )}
        >
          {toast.message}
        </div>
      )}

      <section className="flex flex-wrap items-center gap-4 rounded-xl border border-[#ba1a1a] bg-rose-200 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[#ba1a1a]">
          <Icon className="h-6 w-6" name="shield" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2 text-red-800">
            <span className="text-3xl font-bold leading-9">{patients.length}</span>
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

      {patients.length === 0 ? (
        <section className={cn(styles.card, 'p-10 text-center text-sm text-[#3f4851]')}>
          Không còn ca cấp cứu vô danh nào cần chuẩn hóa danh tính.
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card count={`${patients.length} ca`} icon="alert" title="Bệnh nhân vô danh chưa xác định">
            <div className="divide-y divide-[#eaeef2]">
              {patients.map((p) => {
                const isSelected = p.patientId === selectedPatientId;
                return (
                  <button
                    className={cn(
                      'flex w-full gap-3 p-4 text-left',
                      isSelected ? 'border-l-4 border-l-[#ba1a1a] bg-red-700/5' : 'opacity-70'
                    )}
                    key={p.patientId}
                    type="button"
                    onClick={() => handleSelectPatient(p.patientId)}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        isSelected ? 'bg-rose-200 text-[#ba1a1a]' : 'bg-gray-100 text-gray-400'
                      )}
                    >
                      <Icon name="user" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold leading-4 text-gray-900">{p.tempName}</span>
                      <span className="mt-1 block text-xs leading-5 text-[#3f4851]">
                        STT {String(p.sttNumber).padStart(2, '0')}
                        {p.bedLabel ? ` • Giường ${p.bedLabel}` : ''}
                        {p.roomLabel ? ` • ${p.roomLabel}` : ''}
                      </span>
                      <span
                        className={cn(
                          'mt-1 block text-[10px] font-bold leading-5',
                          isSelected ? 'text-[#ba1a1a]' : 'text-gray-400'
                        )}
                      >
                        Vào viện: {formatAdmittedAt(p.admittedAt)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <section className={cn(styles.card, 'overflow-hidden')}>
            <div className="border-b border-red-700/20 bg-red-50 px-5 py-3">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase leading-4 text-[#ba1a1a]">
                <Icon name="file" />
                Biểu mẫu chuẩn hóa danh tính – STT {String(selectedPatient?.sttNumber ?? 0).padStart(2, '0')}
              </h2>
            </div>
            <div className="space-y-6 p-6">
              <div className="rounded-lg border-l-4 border-gray-300 bg-gray-50 p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500">
                  Thông tin tạm thời (đọc thêm)
                </p>
                <p className="text-xs leading-4 text-gray-900">
                  Tên tạm: <strong>{selectedPatient?.tempName}</strong>
                </p>
                <p className="mt-1 text-xs leading-4 text-gray-600">
                  Lý do cấp cứu: {selectedPatient?.emergencyReason || 'Không có ghi chú'}
                </p>
              </div>
              <p className="inline-flex items-center gap-2 rounded-sm border border-blue-100 bg-sky-50 px-3 py-2 text-xs font-bold uppercase leading-4 text-[#006096]">
                <Icon name="user" />
                Thông tin thực tế chính thức
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Họ và tên thật"
                  required
                  value={form.fullName}
                  onChange={(v) => setForm((prev) => ({ ...prev, fullName: v.toUpperCase() }))}
                  placeholder="NHẬP HỌ TÊN (TỰ CHUYỂN HOA CÓ DẤU)"
                  error={errors.fullName}
                />
                <Field
                  label="Ngày sinh"
                  required
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(v) => setForm((prev) => ({ ...prev, dateOfBirth: v }))}
                  error={errors.dateOfBirth}
                />
                <div>
                  <span className={styles.label}>
                    Giới tính <span className="text-[#ba1a1a]">*</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {(['male', 'female'] as const).map((g) => {
                      const active = form.gender === g;
                      return (
                        <button
                          className={cn(
                            'flex h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium text-[#171c1f]',
                            active ? 'border-[#006096] bg-sky-50' : 'border-[#d1d5db] bg-white'
                          )}
                          key={g}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, gender: g }))}
                        >
                          <span
                            className={cn(
                              'h-4 w-4 rounded-full border p-1',
                              active ? 'border-[#006096] bg-[#006096]' : 'border-gray-500'
                            )}
                          >
                            {active && <span className="block h-full w-full rounded-full bg-white" />}
                          </span>
                          {g === 'male' ? 'Nam' : 'Nữ'}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Field
                  label="Số điện thoại di động VN"
                  required
                  value={form.phoneNumber}
                  onChange={(v) =>
                    setForm((prev) => ({ ...prev, phoneNumber: v.replace(/\D/g, '').slice(0, 10) }))
                  }
                  placeholder="0901234567"
                  error={errors.phoneNumber}
                />
                <Field
                  label="Số CCCD (12 chữ số)"
                  required
                  value={form.identityCardNumber}
                  onChange={(v) =>
                    setForm((prev) => ({ ...prev, identityCardNumber: v.replace(/\D/g, '').slice(0, 12) }))
                  }
                  placeholder="001234567890"
                  error={errors.identityCardNumber}
                />
                <Field
                  label="Địa chỉ thường trú / tạm trú"
                  value={form.address}
                  onChange={(v) => setForm((prev) => ({ ...prev, address: v }))}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                />
                <Field
                  label="Mã thẻ BHYT (nếu có)"
                  value={form.healthInsuranceCode}
                  onChange={(v) => setForm((prev) => ({ ...prev, healthInsuranceCode: v }))}
                  placeholder="DN3501234567890"
                />
                <Field
                  label="Họ tên người bảo hộ / liên hệ"
                  required
                  value={form.guardianFullName}
                  onChange={(v) => setForm((prev) => ({ ...prev, guardianFullName: v }))}
                  placeholder="Họ và tên người thân"
                  error={errors.guardianFullName}
                />
              </div>
              <label className="flex items-start gap-3 rounded-sm border border-gray-200 bg-gray-50 p-3 text-xs leading-4 text-gray-600">
                <input
                  className="mt-0.5 h-4 w-4 rounded border-gray-500"
                  type="checkbox"
                  checked={form.privacyConfirmed}
                  onChange={(e) => setForm((prev) => ({ ...prev, privacyConfirmed: e.target.checked }))}
                />
                <span>
                  Xác nhận bệnh nhân/người nhà đã đồng ý cung cấp thông tin và ký bản cam kết bảo mật
                  theo
                  <strong> Nghị định 13/2023/NĐ-CP</strong> về bảo vệ dữ liệu cá nhân y tế.
                </span>
              </label>
              {errors.privacyConfirmed && (
                <p className="text-xs font-bold text-[#ba1a1a]">{errors.privacyConfirmed}</p>
              )}
              <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-6">
                <button className={styles.secondaryButton} type="button" onClick={handleReset}>
                  Làm mới
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#ba1a1a] px-8 text-sm font-bold text-white shadow-[0_4px_6px_rgba(186,26,26,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isPending}
                  type="button"
                  onClick={handleSubmit}
                >
                  <Icon name="shield" />
                  {isPending ? 'Đang xử lý...' : 'Xác nhận chuẩn hóa danh tính'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required = false,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <label>
      <span className={styles.label}>
        {label} {required && <span className="text-[#ba1a1a]">*</span>}
      </span>
      <input
        className={cn(
          styles.input,
          error && 'border-red-400 text-[#ba1a1a] focus:border-red-500 focus:ring-red-500/10'
        )}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error && <p className="mt-1 text-xs font-bold text-[#ba1a1a]">{error}</p>}
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
