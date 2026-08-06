'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

import { RoleIcon } from '@/shared/components/RoleIcon';
import { Sidebar as SharedSidebar } from '@/shared/components/sidebar/Sidebar';
import type { SidebarNavSectionConfig } from '@/shared/components/sidebar/sidebar.types';
import { ApiError } from '@/shared/api-client/error';
import { AppToast } from '@/shared/components/AppToast';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { useCurrentPrincipal } from '@/shared/hooks/use-current-principal';

import {
  navItems,
  orderTypeLabels,
  screenMeta,
  type IconName,
  type NurseScreen,
  type StatCard,
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
  type SpecimenDto,
} from '../../hooks/useLane6';
import { nurseWorkspaceStyles as styles } from './nurse-workspace.styles';
import {
  getAllergyNoteError,
  getApiErrorMessage,
  getAllVitalFieldErrors,
  getBloodPressureRelationError,
  hasBlockingVitalFormErrors,
  getVisibleEmergencyIdentityErrors,
  getVitalFieldError,
  parseVitalNumber,
  validateEmergencyIdentity,
} from './nurse-validation';

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

/**
 * Hiển thị điều hướng các lane nghiệp vụ của điều dưỡng và số lượng hồ sơ đang chờ.
 *
 * @param activeScreen Lane đang được chọn; mặc định do page cha quản lý là `vitals`.
 * @param onChangeScreen Callback đổi lane, chỉ cập nhật trạng thái UI tại page cha.
 * @remarks Số badge và thông tin tài khoản lấy từ các hook server-state; fallback tải tài khoản
 * không thay thế kiểm tra quyền ở backend. Nút đăng xuất điều hướng về `/login`.
 */
function Sidebar({
  activeScreen,
  onChangeScreen,
}: {
  activeScreen: NurseScreen;
  onChangeScreen: (screen: NurseScreen) => void;
}) {
  const router = useRouter();
  const { data: principal } = useCurrentPrincipal();

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

  const sections: SidebarNavSectionConfig[] = [
    {
      id: 'workspace',
      label: 'Màn hình làm việc',
      items: navItems.map((item) => {
        const active = activeScreen === item.id;
        const badgeCount = badgeCounts[item.id];

        return {
          id: item.id,
          label: item.label,
          isActive: active,
          onClick: () => onChangeScreen(item.id),
          icon: (
            <Icon
              className={cn('h-5 w-5 shrink-0', active ? 'text-[#55d7ed]' : 'text-white/70')}
              name={item.icon}
            />
          ),
          badge: badgeCount ? (
            <span
              className={cn(styles.badge, item.id === 'samples' ? 'bg-[#006096]' : 'bg-[#ba1a1a]')}
            >
              {badgeCount}
            </span>
          ) : undefined,
        };
      }),
    },
  ];

  return (
    <SharedSidebar
      brandName="HMS-VN Clinical"
      footer={
        <>
          <div className="relative shrink-0 transition-transform duration-200 hover:scale-105">
            <div className={styles.logoMark}>
              <Icon className="h-5 w-5 text-white" name="user" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#006096] ring-2 ring-[#001d32]">
              <RoleIcon className="h-2.5 w-2.5 text-white" role="nurse" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-5 text-white">
              {principal?.fullName ?? 'Đang tải tài khoản'}
            </p>
            <p className="text-xs font-medium leading-4 text-white/50">
              {principal?.roleCodes.includes('nurse') ? 'Điều dưỡng' : 'Nhân viên'}
            </p>
          </div>
          <button
            aria-label="Đăng xuất"
            className={styles.iconButton}
            onClick={() => router.push('/login')}
            type="button"
          >
            <Icon name="logOut" />
          </button>
        </>
      }
      navAriaLabel="Màn hình làm việc"
      sections={sections}
    />
  );
}

/**
 * Hiển thị tiêu đề lane, khoa/phòng lấy từ queue sinh hiệu và đồng hồ cục bộ của trình duyệt.
 *
 * @param activeScreen Lane hiện tại để chọn tiêu đề và ngữ cảnh nghiệp vụ.
 * @remarks Khoa/phòng dùng fallback `Đang tải khoa/phòng` khi query chưa có dữ liệu; interval đồng
 * hồ được cleanup khi component unmount.
 */
function Topbar({ activeScreen }: { activeScreen: NurseScreen }) {
  const meta = screenMeta[activeScreen];
  const { data: vitalsQueue } = useVitalsQueue();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Đồng bộ đồng hồ hiển thị với thời gian trình duyệt; phải dọn interval khi đổi lane hoặc
  // unmount.
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

  const screenContext: Record<NurseScreen, string> = {
    vitals: 'Tiếp nhận & sinh hiệu',
    samples: 'Lấy mẫu & bàn giao',
    beds: 'Toàn bộ buồng nội trú',
    orders: 'Y lệnh & chăm sóc',
    emergency: 'Chuẩn hóa cấp cứu',
  };
  const departmentName = vitalsQueue?.departmentName ?? 'Đang tải khoa/phòng';
  const subtitle = `${departmentName} • ${screenContext[activeScreen]} • ${formattedTime}`;

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

/**
 * Hiển thị lane gọi số và danh sách hồ sơ chờ đo sinh hiệu.
 *
 * @param ticketQueue Trạng thái server của số đang gọi và số người đang chờ.
 * @param worklist Danh sách hồ sơ sinh hiệu do `useVitalsQueue` cung cấp.
 * @param selectedRecordId Hồ sơ đang gắn với form nhập cục bộ.
 * @param calledRecordIds Các hồ sơ đã được gọi trong phiên hiện tại để hiển thị trạng thái.
 * @param hasUnsavedInput Chặn gọi số mới khi form đang có dữ liệu chưa lưu.
 * @param onCallNext Callback gọi số tiếp theo và chuyển hồ sơ được chọn.
 * @param onRecall Callback gọi lại số hiện tại hoặc khôi phục thứ tự gọi cục bộ.
 * @param onSelectRecord Callback chọn hồ sơ từ worklist.
 * @param isCalling Trạng thái mutation gọi số để khóa thao tác lặp.
 * @remarks Trạng thái rỗng được hiển thị tại đây; lỗi mutation và quyền truy cập do hook/backend
 * xử lý, component này chỉ điều khiển khả năng thao tác của UI.
 */
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
    <Card
      count={`${ticketQueue.waitingCount} số đang chờ`}
      icon="clipboard"
      title="Hàng đợi chờ đo sinh hiệu"
    >
      <div className="p-3">
        <div className="mb-2 rounded-lg bg-[#eaeef2] p-3 text-center">
          <p className="text-xs font-medium text-[#3f4851]">Số đang gọi</p>
          <p className="text-3xl font-bold text-[#006096]">
            {ticketQueue.currentCalled
              ? String(ticketQueue.currentCalled.number).padStart(2, '0')
              : '--'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={cn(styles.primaryButton, 'h-16 px-4 text-sm')}
            type="button"
            disabled={isCalling || hasUnsavedInput || ticketQueue.waitingCount === 0}
            title={
              hasUnsavedInput
                ? 'Hãy lưu hoặc hủy dữ liệu đang nhập trước khi gọi số mới'
                : undefined
            }
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
                  active && 'border-l-4 border-l-[#006096] bg-[#e0f2fe]',
                )}
                key={item.recordId}
                type="button"
                onClick={() => onSelectRecord(item)}
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate text-xs font-bold uppercase leading-5',
                      active ? 'text-[#006096]' : 'text-[#171c1f]',
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
                        : 'bg-blue-50 text-[#006096]',
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

/**
 * Bản nháp sinh hiệu chưa chuẩn hóa; mọi trường số giữ dạng chuỗi để cho phép nhập từng phần.
 * Các trường sinh hiệu dùng đơn vị bpm, °C, mmHg, lần/phút, %, cm và kg theo nhãn biểu mẫu; ghi
 * chú dị ứng là văn bản tối đa 1.000 ký tự và chỉ có hiệu lực khi `allergyEnabled` bật. Khoảng
 * giá trị hợp lệ do `nurse-validation` quyết định, không được encode đầy đủ trong TypeScript type.
 */
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

/** Bản nháp rỗng dùng khi đổi hồ sơ, hủy hoặc lưu thành công; không mang dữ liệu server cũ. */
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

type VitalInputFieldName = Exclude<keyof VitalsFormState, 'allergyEnabled' | 'allergyNote'>;

/**
 * Trường nhập sinh hiệu dùng chung, hiển thị đơn vị và lỗi validation từ biểu mẫu cha.
 *
 * @param label Nhãn nghiệp vụ của chỉ số.
 * @param unit Đơn vị hiển thị cạnh ô nhập; không tự chuyển đổi giá trị.
 * @param onChange Callback nhận chuỗi thô trong lúc nhập.
 * @param onBlur Callback tùy chọn chạy validation khi rời ô.
 * @param error Lỗi inline đã được chuẩn hóa ở tầng validation.
 * @remarks `min`, `max`, `step` chỉ hỗ trợ gợi ý cho input; backend và hàm validation mới là
 * nguồn quyết định giá trị hợp lệ.
 */
function VitalInputField({
  label,
  unit,
  value,
  onChange,
  onBlur,
  error,
  step,
  inputMode,
  min,
  max,
  required,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  error?: string;
  step?: string;
  inputMode?: 'numeric' | 'decimal';
  min?: number;
  max?: number;
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
          type="text"
          inputMode={inputMode ?? (step ? 'decimal' : 'numeric')}
          min={min}
          max={max}
          step={step}
          className={cn(
            styles.input,
            'rounded-r-none',
            error && 'border-red-400 text-[#ba1a1a] focus:border-red-500 focus:ring-red-500/10',
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(event) => onBlur?.(event.target.value)}
          aria-invalid={Boolean(error)}
        />
        <span className={styles.fieldUnit}>{unit}</span>
      </span>
      {error && (
        <p className="mt-1 text-xs font-bold text-[#ba1a1a]" role="alert">
          {error}
        </p>
      )}
    </label>
  );
}

/**
 * Biểu mẫu nhập sinh hiệu, BMI và tiền sử dị ứng cho hồ sơ đang được gọi.
 *
 * @param selectedRecord Hồ sơ đang chọn; null khi chưa chọn hồ sơ.
 * @param activeTicket Số gọi hiện tại dùng để xác định phiên đo.
 * @param form Bản nháp cục bộ và setter do `VitalsScreen` sở hữu.
 * @param onSave Callback kiểm tra và gửi mutation lưu sinh hiệu.
 * @param onCancel Xóa bản nháp hiện tại nhưng không thay đổi server-state.
 * @param isSaving Trạng thái mutation để khóa nút lưu.
 * @param bmiValue BMI đã tính theo kg/m², hoặc `-` khi thiếu chiều cao/cân nặng.
 * @param attemptedSave Cho biết người dùng đã thử lưu để mở rộng lỗi validation.
 * @param setAttemptedSave Callback reset cờ thử lưu khi người dùng sửa dữ liệu.
 * @remarks Lỗi hiển thị kết hợp lỗi theo từng trường, quan hệ huyết áp và ghi chú dị ứng; quyền
 * ghi dữ liệu vẫn do mutation/backend quyết định.
 */
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
  setAttemptedSave,
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
  setAttemptedSave: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<VitalInputFieldName, string>>>({});
  const [allergyTouched, setAllergyTouched] = useState(false);

  // Khi đổi hồ sơ, lỗi của hồ sơ trước không được tồn tại trong form hồ sơ mới.
  useEffect(() => {
    setFieldErrors({});
    setAllergyTouched(false);
  }, [selectedRecord?.recordId]);

  // Sau lần thử lưu, đồng bộ lỗi từ toàn bộ bản nháp để phản hồi ngay cả trường chưa blur.
  useEffect(() => {
    if (attemptedSave) setFieldErrors(getAllVitalFieldErrors(form));
  }, [attemptedSave, form]);

  // Sửa một trường sẽ xóa lỗi liên quan; hai ô huyết áp được reset cùng nhau vì còn có lỗi quan hệ.
  const handleVitalChange = (field: VitalInputFieldName, value: string) => {
    setAttemptedSave(false);
    setFieldErrors((previous) => {
      if (field === 'bpSystolic' || field === 'bpDiastolic') {
        return { ...previous, bpSystolic: undefined, bpDiastolic: undefined };
      }
      return { ...previous, [field]: undefined };
    });
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  // Blur kiểm tra giá trị trường và quan hệ tâm thu/tâm trương trước khi ghi lỗi inline.
  const handleVitalBlur = (field: VitalInputFieldName, value: string) => {
    const nextForm = { ...form, [field]: value };
    const isBloodPressureField = field === 'bpSystolic' || field === 'bpDiastolic';
    const fieldError = getVitalFieldError(field, value);
    const bloodPressureError = isBloodPressureField
      ? !getVitalFieldError('bpSystolic', nextForm.bpSystolic) &&
        !getVitalFieldError('bpDiastolic', nextForm.bpDiastolic)
        ? getBloodPressureRelationError(nextForm.bpSystolic, nextForm.bpDiastolic)
        : undefined
      : undefined;

    setFieldErrors((previous) => ({
      ...previous,
      [field]: fieldError,
      ...(bloodPressureError
        ? { bpSystolic: bloodPressureError, bpDiastolic: bloodPressureError }
        : {}),
    }));
  };

  // Tính lỗi quan hệ từ form hiện tại để không phụ thuộc vào closure của sự kiện blur.
  // Điều này bảo đảm lỗi xuất hiện ngay sau khi cả hai ô huyết áp đã có giá trị hợp lệ.
  const liveBloodPressureError = useMemo(() => {
    if (
      getVitalFieldError('bpSystolic', form.bpSystolic) ||
      getVitalFieldError('bpDiastolic', form.bpDiastolic)
    ) {
      return undefined;
    }

    return getBloodPressureRelationError(form.bpSystolic, form.bpDiastolic);
  }, [form.bpDiastolic, form.bpSystolic]);

  const visibleFieldErrors = useMemo(() => {
    const errors = attemptedSave ? getAllVitalFieldErrors(form) : fieldErrors;
    if (!liveBloodPressureError) return errors;

    return {
      ...errors,
      bpSystolic: errors.bpSystolic ?? liveBloodPressureError,
      bpDiastolic: errors.bpDiastolic ?? liveBloodPressureError,
    };
  }, [attemptedSave, fieldErrors, form, liveBloodPressureError]);
  const allergyNoteError = getAllergyNoteError(
    form.allergyEnabled,
    form.allergyNote,
    attemptedSave || allergyTouched,
  );
  const canSave =
    Boolean(activeTicket) &&
    Boolean(selectedRecord) &&
    !isSaving &&
    !hasBlockingVitalFormErrors(form, form.allergyEnabled, form.allergyNote);

  return (
    <Card icon="heart" title="Chỉ số sinh tồn (Vital signs)">
      <div className="space-y-6 p-6">
        {selectedRecord ? (
          <div className="rounded-lg bg-[#e0f2fe] p-3 text-xs font-bold text-[#006096]">
            Đang nhập sinh hiệu cho: <span className="uppercase">{selectedRecord.patientName}</span>{' '}
            ({selectedRecord.gender}, {selectedRecord.age}t — BA: {selectedRecord.recordCode})
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
            min={30}
            max={220}
            value={form.pulse}
            error={visibleFieldErrors.pulse}
            onChange={(v) => handleVitalChange('pulse', v)}
            onBlur={(v) => handleVitalBlur('pulse', v)}
          />

          <VitalInputField
            label="Nhiệt độ (°C)"
            unit="°C"
            step="0.1"
            min={34}
            max={43}
            value={form.temperatureC}
            error={visibleFieldErrors.temperatureC}
            onChange={(v) => handleVitalChange('temperatureC', v)}
            onBlur={(v) => handleVitalBlur('temperatureC', v)}
          />

          <VitalInputField
            label="Huyết áp tâm thu (mmHg)"
            unit="mmHg"
            required
            min={50}
            max={280}
            value={form.bpSystolic}
            error={visibleFieldErrors.bpSystolic}
            onChange={(v) => handleVitalChange('bpSystolic', v)}
            onBlur={(v) => handleVitalBlur('bpSystolic', v)}
          />

          <VitalInputField
            label="Huyết áp tâm trương (mmHg)"
            unit="mmHg"
            required
            min={20}
            max={180}
            value={form.bpDiastolic}
            error={visibleFieldErrors.bpDiastolic}
            onChange={(v) => handleVitalChange('bpDiastolic', v)}
            onBlur={(v) => handleVitalBlur('bpDiastolic', v)}
          />

          <VitalInputField
            label="Nhịp thở (lần/phút)"
            unit="lần/ph"
            min={1}
            max={80}
            value={form.respiratoryRate}
            error={visibleFieldErrors.respiratoryRate}
            onChange={(v) => handleVitalChange('respiratoryRate', v)}
            onBlur={(v) => handleVitalBlur('respiratoryRate', v)}
          />

          <VitalInputField
            label="SpO2 (%)"
            unit="%"
            required
            min={50}
            max={100}
            value={form.spo2}
            error={visibleFieldErrors.spo2}
            onChange={(v) => handleVitalChange('spo2', v)}
            onBlur={(v) => handleVitalBlur('spo2', v)}
          />

          <VitalInputField
            label="Chiều cao (cm)"
            unit="cm"
            step="0.1"
            min={40}
            max={250}
            value={form.heightCm}
            error={visibleFieldErrors.heightCm}
            onChange={(v) => handleVitalChange('heightCm', v)}
            onBlur={(v) => handleVitalBlur('heightCm', v)}
          />

          <VitalInputField
            label="Cân nặng (kg)"
            unit="kg"
            step="0.1"
            min={1}
            max={300}
            value={form.weightKg}
            error={visibleFieldErrors.weightKg}
            onChange={(v) => handleVitalChange('weightKg', v)}
            onBlur={(v) => handleVitalBlur('weightKg', v)}
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
              allergyNoteError && 'animate-blink-red',
            )}
          >
            <div className="flex flex-wrap items-center gap-4">
              <button
                aria-pressed={form.allergyEnabled}
                className={cn(
                  'relative h-6 w-12 rounded-full shadow-inner focus:outline-none focus:ring-4 transition-colors',
                  form.allergyEnabled
                    ? 'bg-[#ba1a1a] focus:ring-[#ba1a1a]/20'
                    : 'bg-[#bfc7d2] focus:ring-gray-200',
                )}
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, allergyEnabled: !prev.allergyEnabled }))
                }
              >
                <span
                  className={cn(
                    'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all',
                    form.allergyEnabled ? 'right-1' : 'left-1',
                  )}
                />
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm font-bold leading-5',
                    form.allergyEnabled ? 'text-[#ba1a1a]' : 'text-[#3f4851]',
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
                    : 'border-[#bfc7d2] bg-[#e4e9ed]/40 text-[#707882] cursor-not-allowed',
                )}
                disabled={!form.allergyEnabled}
                value={form.allergyNote}
                onChange={(e) => setForm((prev) => ({ ...prev, allergyNote: e.target.value }))}
                onBlur={() => setAllergyTouched(true)}
                placeholder="Nhập mô tả chi tiết: tên thuốc, loại thức ăn gây dị ứng và biểu hiện dị ứng... Ví dụ: Penicillin → nổi mề đay toàn thân"
                maxLength={1000}
              />
              {form.allergyEnabled && allergyNoteError && (
                <p className="mt-1 text-xs font-bold text-[#ba1a1a]">{allergyNoteError}</p>
              )}
              {form.allergyEnabled && (
                <p className="mt-1 text-right text-[10px] font-medium text-[#707882]">
                  {form.allergyNote.length}/1000 ký tự
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

/** Khóa localStorage lưu trạng thái lane sinh hiệu trong ngày hiện tại. */
const VITALS_QUEUE_STATE_KEY = 'nurse:vitals-queue-state';

/** Trả về ngày hiện tại theo múi giờ trình duyệt ở định dạng `YYYY-MM-DD`. */
function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Điều phối lane gọi số và nhập sinh hiệu cho điều dưỡng.
 *
 * @remarks Worklist, ticket và mutation lấy từ các hook `useLane6`; form, hồ sơ chọn và thứ tự gọi
 * là local state. Trạng thái đã gọi được lưu vào localStorage theo ngày để khôi phục sau reload,
 * còn dữ liệu không còn trong worklist sẽ bị loại bỏ. Page hiển thị loading và toast success/error;
 * danh sách rỗng được `PatientQueue` mô tả. Phím F2/F9 và mutation chỉ là UI hỗ trợ, không thay thế
 * authorization ở backend.
 */
function VitalsScreen() {
  const { data, isLoading } = useVitalsQueue();
  const { mutate: callNext, isPending: isCalling } = useCallNextTicket();
  const { mutate: recall } = useRecallTicket();
  const { mutate: saveVitalSigns, isPending: isSaving } = useRecordVitalSigns();

  const [selectedRecord, setSelectedRecord] = useState<VitalsWorklistItemDto | null>(null);
  const [calledOrder, setCalledOrder] = useState<string[]>([]);
  const [form, setForm] = useState<VitalsFormState>(emptyVitalsForm);
  const { hideToast, showToast, toast } = useAppToast(3000);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const hydratedRef = useRef(false);

  const activeTicket = data?.ticketQueue.currentCalled ?? null;
  const worklist = data?.worklist ?? [];
  const statsData = data?.stats;

  // Set chỉ phục vụ tra cứu trạng thái đã gọi trong render, không phải nguồn trạng thái server.
  const calledRecordIds = useMemo(() => new Set(calledOrder), [calledOrder]);

  // Hydrate một lần sau khi worklist đầu tiên có dữ liệu; lọc ID cũ để tránh chọn hồ sơ stale.
  // localStorage là external system nên chỉ đọc sau mount và dùng ref để tránh hydrate lặp.
  useEffect(() => {
    if (hydratedRef.current || !data) return;
    hydratedRef.current = true;

    try {
      const raw = window.localStorage.getItem(VITALS_QUEUE_STATE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        date?: string;
        selectedRecordId?: string | null;
        calledOrder?: string[];
      };
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

  // Ghi lại lựa chọn và thứ tự gọi khi local state đổi; không có listener cần cleanup ở effect này.
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

  // Cờ này bảo vệ lane khỏi việc gọi số mới khi bản nháp sinh hiệu hiện tại chưa được lưu/hủy.
  const hasUnsavedInput = useMemo(() => {
    return Object.entries(form).some(([k, v]) => k !== 'allergyEnabled' && v !== '' && v !== false);
  }, [form]);

  // BMI dùng kg/m², chỉ hiển thị khi parse được cả chiều cao cm và cân nặng kg; thiếu dữ liệu
  // trả `-`.
  const bmiValue = useMemo(() => {
    const height = parseVitalNumber(form.heightCm);
    const weight = parseVitalNumber(form.weightKg);
    if (height && weight) {
      const h = height;
      const w = weight;
      const bmi = w / (h / 100) ** 2;
      return bmi.toFixed(1);
    }
    return '-';
  }, [form.heightCm, form.weightKg]);

  /** Chọn hồ sơ mới và xóa bản nháp cũ, đồng thời nạp lại dị ứng đã có trên worklist nếu có. */
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

  /**
   * Xử lý click/F2 gọi số tiếp theo sau khi chặn bản nháp chưa lưu.
   * Mutation gọi ticket được kích hoạt nếu server còn hàng chờ; local worklist sau đó xoay vòng
   * sang hồ sơ chưa gọi và reset form. Lỗi mutation được hook quản lý.
   */
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
      const currentIndex = currentWorklist.findIndex(
        (item) => item.recordId === selectedRecord.recordId,
      );
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

  /** Gọi lại ticket hiện tại hoặc khôi phục hồ sơ đầu tiên trong thứ tự gọi cục bộ. */
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

  // Hủy chỉ xóa local draft và cờ validation; không phát sinh mutation lên server.
  const handleCancel = () => {
    setForm(emptyVitalsForm);
    setAttemptedSave(false);
  };

  const handleSelectRecord = useCallback(
    (item: VitalsWorklistItemDto) => {
      selectRecordAndResetForm(item);
    },
    [selectRecordAndResetForm],
  );

  /**
   * Xử lý lưu sinh hiệu: guard ticket/hồ sơ, validate số và gửi phiên bản hồ sơ kỳ vọng.
   * Thành công xóa hồ sơ khỏi thứ tự gọi, reset form và thông báo; lỗi giữ bản nháp để người dùng
   * sửa hoặc thử lại.
   */
  const handleSave = useCallback(() => {
    if (!activeTicket || !selectedRecord || isSaving) return;
    if (hasBlockingVitalFormErrors(form, form.allergyEnabled, form.allergyNote)) {
      setAttemptedSave(true);
      return;
    }

    const pulse = parseVitalNumber(form.pulse);
    const bloodPressureSystolic = parseVitalNumber(form.bpSystolic);
    const bloodPressureDiastolic = parseVitalNumber(form.bpDiastolic);
    const spo2 = parseVitalNumber(form.spo2);
    if (
      pulse === null ||
      bloodPressureSystolic === null ||
      bloodPressureDiastolic === null ||
      spo2 === null
    ) {
      setAttemptedSave(true);
      return;
    }

    saveVitalSigns(
      {
        recordId: selectedRecord.recordId,
        ticketId: activeTicket.id,
        expectedRecordVersion: selectedRecord.version,
        pulse,
        temperatureC: parseVitalNumber(form.temperatureC) ?? undefined,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        respiratoryRate: parseVitalNumber(form.respiratoryRate) ?? undefined,
        spo2,
        heightCm: parseVitalNumber(form.heightCm) ?? undefined,
        weightKg: parseVitalNumber(form.weightKg) ?? undefined,
        allergies: form.allergyEnabled ? form.allergyNote.trim() : '',
      },
      {
        onSuccess: () => {
          if (selectedRecord) {
            setCalledOrder((prev) => prev.filter((id) => id !== selectedRecord.recordId));
          }
          showToast('Đã lưu kết quả sinh hiệu thành công!', 'success');
          setForm(emptyVitalsForm);
          setSelectedRecord(null);
          setAttemptedSave(false);
        },
        onError: (error) => {
          showToast(
            error instanceof ApiError ? error.message : 'Lưu thất bại, vui lòng thử lại!',
            'error',
          );
        },
      },
    );
  }, [activeTicket, selectedRecord, isSaving, form, saveVitalSigns, showToast]);

  // Đồng bộ phím tắt với window; ngăn submit mặc định và luôn tháo listener khi dependencies đổi.
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

  const stats: StatCard[] = useMemo(
    () => [
      {
        value: String(statsData?.measuredTodayCount ?? 0),
        label: 'Đã đo hôm nay',
        icon: 'check',
        iconClass: 'bg-green-100 text-[#15803d]',
        delta:
          statsData?.measuredTodayDelta != null
            ? `${statsData.measuredTodayDelta >= 0 ? '+' : ''}${statsData.measuredTodayDelta} so hôm qua`
            : undefined,
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
    ],
    [statsData],
  );

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm font-medium text-[#3f4851]">
        Đang tải dữ liệu sinh hiệu...
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <AppToast message={toast.message} onClose={hideToast} tone={toast.tone} />
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
          setAttemptedSave={setAttemptedSave}
        />
      </div>
    </div>
  );
}

/**
 * Hiển thị mã vạch mẫu bệnh phẩm và cho phép tải ảnh PNG về máy.
 *
 * @param specimen Mẫu bệnh phẩm đã được mutation in mã vạch xác nhận.
 * @param onClose Callback đóng modal; click bên trong không làm nổi bọt ra overlay.
 * @remarks Canvas được đồng bộ bằng JsBarcode khi `specimenCode` đổi; dữ liệu bệnh nhân chỉ hiển
 * thị trong phạm vi modal hiện tại và quyền thao tác do flow lấy mẫu/backend kiểm soát.
 */
function BarcodeModal({ specimen, onClose }: { specimen: SpecimenDto; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Vẽ lại canvas khi mã mẫu đổi; JsBarcode ghi vào external DOM node nên không cần state
  // trung gian.
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

  // Click tải ảnh lấy từ canvas đã vẽ; nếu canvas chưa sẵn sàng thì bỏ qua để tránh lỗi runtime.
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `barcode-${specimen.specimenCode}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
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

/**
 * Quản lý hai bước lấy mẫu và bàn giao mẫu bệnh phẩm của điều dưỡng.
 *
 * @remarks Danh sách mẫu lấy từ `useSpecimens`; bộ lọc và bệnh nhân đang chọn là local state.
 * Các mutation in mã vạch, lấy mẫu và bàn giao cập nhật server-state qua hook, hiển thị lỗi bằng
 * toast và trạng thái rỗng theo từng tab. UI này chỉ là access boundary của điều dưỡng, không thay
 * thế authorization của API.
 */
function SamplesScreen() {
  const { data: specimens = [] } = useSpecimens();
  const collectSpecimenMutation = useCollectSpecimen();
  const printBarcodeMutation = usePrintSpecimenBarcode();
  const handoffSpecimenMutation = useHandoffSpecimen();
  const [barcodeSpecimen, setBarcodeSpecimen] = useState<SpecimenDto | null>(null);
  const { hideToast, showToast, toast } = useAppToast(4000);

  const [activeTab, setActiveTab] = useState<'collect' | 'handoff'>('collect');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedPatientCode, setSelectedPatientCode] = useState<string | null>(null);

  // Thẻ thống kê được tính trực tiếp từ server-state mẫu để không tạo nguồn dữ liệu thứ hai.
  const pendingCount = specimens.filter((s) => s.status === 'pending').length;
  const collectedCount = specimens.filter(
    (s) => s.status === 'collected' || s.status === 'handed_over',
  ).length;
  const handoffCount = specimens.filter((s) => s.status === 'collected').length;
  const priorityCount = specimens.filter((s) => s.priority && s.status !== 'handed_over').length;

  const stats: StatCard[] = [
    {
      value: String(pendingCount),
      label: 'Chờ lấy mẫu',
      icon: 'flask',
      iconClass: 'bg-blue-100 text-[#006096]',
    },
    {
      value: String(collectedCount),
      label: 'Đã lấy mẫu',
      icon: 'check',
      iconClass: 'bg-green-100 text-[#15803d]',
    },
    {
      value: String(handoffCount),
      label: 'Chờ bàn giao lab',
      icon: 'file',
      iconClass: 'bg-teal-100 text-[#006673]',
    },
    {
      value: String(priorityCount),
      label: 'Mẫu cấp cứu ưu tiên',
      icon: 'alert',
      iconClass: 'bg-red-100 text-[#ba1a1a]',
    },
  ];

  // Bộ lọc chỉ thu hẹp dữ liệu đã tải ở client; mutation vẫn gửi ID mẫu do server cấp.
  const filteredSpecimens = specimens.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.specimenCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      departmentFilter === 'all' ||
      s.departmentName.toLowerCase().includes(departmentFilter.toLowerCase());
    return matchesSearch && matchesDept;
  });

  const pendingSpecimens = filteredSpecimens.filter((s) => s.status === 'pending');
  const collectedSpecimens = filteredSpecimens.filter((s) => s.status === 'collected');

  // Gom các mẫu chờ theo bệnh nhân để danh sách bên trái không lặp một bệnh nhân nhiều lần.
  const pendingPatientsMap = new Map<
    string,
    { patientCode: string; patientName: string; count: number; departmentName: string }
  >();
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
      <AppToast message={toast.message} onClose={hideToast} tone={toast.tone} />
      <StatGrid stats={stats} />
      <section className={cn(styles.card, 'overflow-hidden')}>
        <div className="flex border-b border-[#bfc7d2] bg-[#f0f4f8]">
          <button
            className={cn(
              'px-6 py-3 text-sm font-medium transition-colors',
              activeTab === 'collect'
                ? 'border-b-2 border-[#006096] text-[#006096]'
                : 'text-[#3f4851] hover:text-[#171c1f]',
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
                : 'text-[#3f4851] hover:text-[#171c1f]',
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
                <div className="p-4 text-center text-xs text-[#3f4851]">
                  Không có bệnh nhân nào chờ lấy mẫu
                </div>
              ) : (
                pendingPatientsList.map((patient, index) => (
                  <button
                    className={cn(
                      'flex w-full items-center gap-3 border-b border-[#eaeef2] p-4 text-left transition-colors',
                      patient.patientCode === activePatientCode &&
                        'border-l-4 border-l-[#006096] bg-indigo-50',
                    )}
                    key={patient.patientCode}
                    type="button"
                    onClick={() => setSelectedPatientCode(patient.patientCode)}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-sm text-sm font-bold text-white',
                        index % 2 === 1 ? 'bg-green-600' : 'bg-[#006096]',
                      )}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold uppercase text-[#171c1f]">
                        {patient.patientName}
                      </span>
                      <span className="block text-xs text-[#3f4851]">
                        Mã: {patient.patientCode}
                      </span>
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
                    <h2 className="text-lg font-bold leading-7 text-[#171c1f]">
                      {selectedPatientInfo.patientName}
                    </h2>
                    <p className="text-xs leading-5 text-[#3f4851]">
                      Mã BN: {selectedPatientInfo.patientCode} • Khoa:{' '}
                      {selectedPatientInfo.departmentName}
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
                        order.priority && 'border-l-4 border-l-[#ba1a1a]',
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
                        <span className="text-xs font-bold uppercase text-[#3f4851]">
                          Chờ lấy mẫu
                        </span>
                      </div>
                      <div className="space-y-2 px-4 py-4">
                        <h3 className="text-base font-bold leading-6 text-[#006096]">
                          {order.orderDescription}
                        </h3>
                        <p className="text-xs leading-5 text-[#3f4851]">
                          Bệnh nhân:{' '}
                          <strong className="text-[#171c1f]">
                            {order.patientName} ({order.patientCode})
                          </strong>{' '}
                          • Khoa: <strong className="text-[#171c1f]">{order.departmentName}</strong>
                        </p>
                        <div className="flex flex-wrap justify-end gap-3 pt-3">
                          <button
                            className={styles.primaryButton}
                            type="button"
                            disabled={printBarcodeMutation.isPending}
                            onClick={() => {
                              printBarcodeMutation.mutate(
                                { id: order.id },
                                {
                                  onSuccess: () => setBarcodeSpecimen(order),
                                  onError: (error) =>
                                    showToast(
                                      getApiErrorMessage(
                                        error,
                                        'Không thể in mã vạch mẫu bệnh phẩm.',
                                      ),
                                      'error',
                                    ),
                                },
                              );
                            }}
                          >
                            {order.barcodePrinted ? 'In lại mã vạch' : 'In mã vạch (Barcode)'}
                          </button>
                          <button
                            className={styles.primaryButton}
                            type="button"
                            disabled={collectSpecimenMutation.isPending}
                            onClick={() =>
                              collectSpecimenMutation.mutate(
                                { id: order.id },
                                {
                                  onError: (error) =>
                                    showToast(
                                      getApiErrorMessage(error, 'Không thể ghi nhận lấy mẫu.'),
                                      'error',
                                    ),
                                },
                              )
                            }
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
                <h2 className="text-lg font-bold leading-7 text-[#171c1f]">
                  Danh sách mẫu đã lấy — Chờ bàn giao Phòng Lab
                </h2>
                <p className="text-xs text-[#3f4851]">
                  Các mẫu bệnh phẩm đã được lấy thành công, sẵn sàng bàn giao sang kỹ thuật viên
                  phòng xét nghiệm
                </p>
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
                      <p className="text-xs text-[#3f4851] font-medium">
                        Loại mẫu: {spec.specimenType}
                      </p>
                      <p className="text-xs text-[#3f4851]">
                        Bệnh nhân: <strong>{spec.patientName}</strong> ({spec.patientCode})
                      </p>
                      <p className="text-xs text-[#3f4851]">
                        Thời gian lấy:{' '}
                        {spec.collectedAt
                          ? new Date(spec.collectedAt).toLocaleTimeString('vi-VN') +
                            ' - ' +
                            new Date(spec.collectedAt).toLocaleDateString('vi-VN')
                          : '—'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#eaeef2]">
                      <span className="text-xs text-[#3f4851]">
                        KTV tiếp nhận:{' '}
                        <span className="font-semibold text-[#171c1f]">Phòng Lab Central</span>
                      </span>
                      <button
                        className={styles.primaryButton}
                        type="button"
                        disabled={handoffSpecimenMutation.isPending}
                        onClick={() =>
                          handoffSpecimenMutation.mutate(
                            { id: spec.id, labReceiverName: 'Phòng Lab Central' },
                            {
                              onError: (error) =>
                                showToast(
                                  getApiErrorMessage(
                                    error,
                                    'Không thể bàn giao mẫu cho phòng Lab.',
                                  ),
                                  'error',
                                ),
                            },
                          )
                        }
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

/**
 * Hiển thị một giường nội trú và các thao tác tiếp nhận, chuyển giường, xem bệnh án, xuất viện.
 *
 * @param bed Dữ liệu giường từ `useBeds`, gồm trạng thái, hồ sơ và phiên bản kỳ vọng.
 * @param selectedRecordId Hồ sơ đang chờ xếp giường được chọn ở thanh thao tác.
 * @param isEmergency Overlay cấp cứu chỉ dùng cho trạng thái hiển thị hiện tại.
 * @param waitingPatients Danh sách hồ sơ chờ giường để kiểm tra version trước khi assign.
 * @param transferSourceBedId Giường nguồn đang được chọn trong flow chuyển giường.
 * @param onStartTransfer Bắt đầu chọn giường đích.
 * @param onSelectTransferTarget Mở modal nhập lý do chuyển khi chọn giường trống.
 * @param onError Hiển thị lỗi mutation hoặc thiếu dữ liệu phiên bản ở component cha.
 * @param isChanging Khóa thao tác chuyển giường khi mutation đang chạy.
 * @remarks Giường trống yêu cầu hồ sơ và version hợp lệ; giường chờ xuất viện mới cho phép hoàn tất
 * discharge. Các guard trên UI không thay thế authorization và optimistic/concurrency check ở API.
 */
function BedCard({
  bed,
  selectedRecordId,
  isEmergency,
  allBeds,
  waitingPatients,
  transferSourceBedId,
  onStartTransfer,
  onSelectTransferTarget,
  onError,
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
  onError: (message: string) => void;
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
              onError('Vui lòng chọn hồ sơ bệnh nhân chờ giường ở thanh công cụ phía trên trước!');
              return;
            }
            const patient = waitingPatients.find((p) => p.recordId === selectedRecordId);
            if (patient?.version === undefined || patient?.version === null) {
              onError('Không tìm thấy phiên bản hồ sơ bệnh án hợp lệ!');
              return;
            }
            assignBed(
              { recordId: selectedRecordId, bedId: bed.id, expectedRecordVersion: patient.version },
              {
                onError: (error) =>
                  onError(getApiErrorMessage(error, 'Không thể tiếp nhận bệnh nhân vào giường.')),
              },
            );
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
      <article
        className={cn('overflow-hidden rounded-xl border bg-white shadow-sm transition-all', tone)}
      >
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
              transferSourceBedId === bed.id &&
                'border-[#006096] bg-sky-50 text-[#006096] font-bold',
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
              'h-8 px-2 text-[10px]',
            )}
            type="button"
            disabled={effectiveStatus !== 'discharge' || isDischarging || !bed.recordId}
            onClick={() => {
              if (bed.recordId && bed.recordVersion !== null && bed.recordVersion !== undefined) {
                processDischarge(
                  { recordId: bed.recordId, expectedRecordVersion: bed.recordVersion },
                  {
                    onError: (error) =>
                      onError(getApiErrorMessage(error, 'Không thể hoàn tất xuất viện.')),
                  },
                );
              } else {
                onError('Thông tin phiên bản hồ sơ không hợp lệ!');
              }
            }}
          >
            {isDischarging ? 'Đang...' : effectiveStatus === 'discharge' ? 'Hoàn tất' : 'Xuất'}
          </button>
        </div>
      </article>
      {showRecordModal && (
        <MedicalRecordModal bed={bed} onClose={() => setShowRecordModal(false)} />
      )}
    </>
  );
}

/**
 * Thu thập lý do chuyển giường trước khi gửi mutation.
 *
 * @param sourceBed Giường nguồn hiện tại.
 * @param targetBed Giường đích đã chọn.
 * @param isPending Khóa đóng/xác nhận trong lúc server xử lý.
 * @param onCancel Hủy flow chuyển và giữ nguyên server-state.
 * @param onConfirm Gửi lý do đã trim, hợp lệ từ 10 đến 255 ký tự.
 */
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
  const [reasonTouched, setReasonTouched] = useState(false);
  const trimmedLen = reason.trim().length;
  const isTooLong = reason.length > 255;
  const isValid = trimmedLen >= 10 && !isTooLong;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
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
          Lý do chuyển giường (10-255 ký tự)
        </label>
        <textarea
          className={cn(styles.input, 'h-24 w-full text-xs')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setReasonTouched(true)}
          placeholder="Nhập lý do chuyển giường..."
          autoFocus
          maxLength={255}
        />
        {!isValid && (reasonTouched || reason.length > 0) && (
          <p className="mt-1 text-[10px] text-red-600">
            {isTooLong
              ? 'Lý do tối đa 255 ký tự.'
              : `Lý do cần tối thiểu 10 ký tự (hiện ${trimmedLen}).`}
          </p>
        )}
        <p className="mt-1 text-right text-[10px] text-[#707882]">{reason.length}/255 ký tự</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={onCancel}
            disabled={isPending}
          >
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

/**
 * Hiển thị thông tin bệnh án ở chế độ chỉ đọc cho giường đang chọn.
 *
 * @param bed Dữ liệu hồ sơ/giường cần xem.
 * @param onClose Callback đóng modal.
 * @remarks Modal không mutation và không quyết định quyền đọc; API/backend vẫn là boundary bảo vệ
 * dữ liệu y tế nhạy cảm.
 */
function MedicalRecordModal({ bed, onClose }: { bed: BedDto; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
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
            <dd className="text-[#171c1f]">
              {bed.roomName} — Giường {bed.bed}
            </dd>
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

/** Trạng thái dùng riêng cho bộ lọc; `empty` của API được chuẩn hóa thành `available`. */
type BedFilterStatus = 'available' | 'occupied' | 'emergency' | 'discharge' | 'maintenance';

/** Nhãn tiếng Việt tương ứng với trạng thái lọc giường trên UI. */
const BED_STATUS_LABELS: Record<BedFilterStatus, string> = {
  available: 'Trống',
  occupied: 'Đang dùng',
  emergency: 'Cấp cứu',
  discharge: 'Chờ xuất viện',
  maintenance: 'Bảo trì',
};

/**
 * Chuẩn hóa trạng thái API và overlay cấp cứu cho bộ lọc giường.
 * Overlay cấp cứu có ưu tiên cao nhất, sau đó đến trạng thái API; giường `empty` được xem là trống.
 */
function normalizeBedStatus(bed: BedDto, isEmergencyOverlay: boolean): BedFilterStatus {
  if (isEmergencyOverlay || bed.status === 'emergency') return 'emergency';
  if (bed.status === 'available' || bed.status === 'empty') return 'available';
  if (bed.status === 'maintenance') return 'maintenance';
  if (bed.status === 'discharge') return 'discharge';
  return 'occupied';
}

/**
 * Quản lý lane buồng giường nội trú, tiếp nhận hồ sơ chờ giường, chuyển giường và xuất viện.
 *
 * @remarks Dữ liệu giường và admission board lấy từ `useBeds`/`useAdmissionBoard`; bộ lọc và danh
 * sách overlay cấp cứu là local state. Mutation assign/transfer/discharge dùng record version và
 * phản hồi lỗi qua toast. Loading được hiển thị tại screen; danh sách rỗng không có row riêng. Các
 * overlay cấp cứu chỉ là trạng thái UI trong phiên, không phải xác nhận persistence hay quyền API.
 */
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
  const { hideToast, showToast, toast } = useAppToast(4000);

  const bedsList: BedDto[] = apiBeds || [];
  const waitingPatients = admissionBoard || [];
  const sourceBedForModal = bedsList.find((b) => b.id === transferSourceBedId) ?? null;
  const showErrorToast = (message: string) => showToast(message, 'error');

  if (isLoading) {
    return <div className="p-8 text-center text-[#3f4851]">Đang tải dữ liệu buồng giường...</div>;
  }
  const totalBeds = bedsList.length;
  const occupiedCount = bedsList.filter((b) => b.status === 'occupied').length;
  const availableCount = bedsList.filter((b) => b.status === 'available').length;
  const dischargeCount = bedsList.filter((b) => b.status === 'discharge').length;
  const occupiedPercent = totalBeds > 0 ? Math.round((occupiedCount / totalBeds) * 100) : 0;

  const stats: StatCard[] = [
    {
      value: totalBeds.toString(),
      label: 'Tổng số giường',
      icon: 'bed',
      iconClass: 'bg-indigo-50 text-[#006096]',
    },
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
    new Set(bedsList.map((b) => normalizeBedStatus(b, emergencyBedIds.includes(b.id)))),
  );

  const filteredBedsList = bedsList.filter((b) => {
    const matchesRoom = roomFilter === 'all' || b.roomName === roomFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      normalizeBedStatus(b, emergencyBedIds.includes(b.id)) === statusFilter;
    return matchesRoom && matchesStatus;
  });

  const rooms = filteredBedsList.reduce((acc: Record<string, BedDto[]>, bed: BedDto) => {
    if (!acc[bed.roomName]) acc[bed.roomName] = [];
    acc[bed.roomName].push(bed);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <AppToast message={toast.message} onClose={hideToast} tone={toast.tone} />
      <StatGrid stats={stats} />

      {/* Thanh thao tác tiếp nhận hồ sơ, đánh dấu cấp cứu và lọc giường. */}
      <div className="rounded-xl border border-[#bfc7d2] bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-4 items-center justify-between border-b border-[#eaeef2] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#171c1f]">
              Tiếp nhận bệnh nhân chờ giường:
            </span>
            <select
              className={cn(styles.input, 'w-80 text-xs')}
              value={selectedRecordId}
              onChange={(e) => setSelectedRecordId(e.target.value)}
            >
              <option value="">
                -- Chọn bệnh nhân chờ xếp giường ({waitingPatients.length}) --
              </option>
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
                'whitespace-nowrap text-red-600 border-red-300 hover:bg-red-50 text-xs h-9 px-3',
              )}
              type="button"
              disabled={!selectedEmergencyBedId}
              onClick={() => {
                if (selectedEmergencyBedId) {
                  setEmergencyBedIds((prev) =>
                    prev.includes(selectedEmergencyBedId)
                      ? prev.filter((id) => id !== selectedEmergencyBedId)
                      : [...prev, selectedEmergencyBedId],
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
              Đang chuyển bệnh nhân từ giường{' '}
              {bedsList.find((b) => b.id === transferSourceBedId)?.bed ?? ''}
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
                  onError={showErrorToast}
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
            // Chỉ gửi chuyển giường khi hồ sơ nguồn còn recordId và version để backend kiểm tra
            // cạnh tranh.
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
                  onError: (error) =>
                    showErrorToast(getApiErrorMessage(error, 'Không thể chuyển giường.')),
                },
              );
            }
          }}
        />
      )}
    </div>
  );
}

/**
 * Modal nhập lý do bắt buộc trước khi điều dưỡng hủy y lệnh.
 *
 * @param isPending Khóa modal trong lúc mutation cập nhật trạng thái y lệnh.
 * @param onCancel Đóng modal mà không gửi mutation.
 * @param onConfirm Gửi lý do đã trim khi có nội dung và không vượt quá 500 ký tự.
 * @remarks Validation inline chỉ hỗ trợ UX; trạng thái hủy và quyền thao tác do API quyết định.
 */
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
  const [reasonTouched, setReasonTouched] = useState(false);
  const [attemptedConfirm, setAttemptedConfirm] = useState(false);
  const isTooLong = reason.length > 500;
  const isValid = reason.trim().length > 0 && !isTooLong;
  const showError = (reasonTouched || attemptedConfirm || isTooLong) && !isValid;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-sm font-bold text-[#171c1f]">Hủy y lệnh</h3>
        <label className="mb-1 block text-xs font-semibold text-[#171c1f]">Lý do hủy</label>
        <textarea
          className={cn(
            styles.input,
            'h-24 w-full text-xs',
            showError &&
              'border-red-500 ring-2 ring-red-500/30 focus:border-red-500 focus:ring-red-500/30',
          )}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setReasonTouched(true)}
          placeholder="Nhập lý do hủy y lệnh..."
          autoFocus
          maxLength={500}
        />
        {showError && (
          <p className="mt-1 text-xs font-bold text-red-600">
            {isTooLong ? 'Lý do hủy tối đa 500 ký tự' : 'BẮT BUỘC NHẬP LÝ DO HỦY Y LỆNH'}
          </p>
        )}
        <p className="mt-1 text-right text-[10px] text-[#707882]">{reason.length}/500 ký tự</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={onCancel}
            disabled={isPending}
          >
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

/**
 * Hiển thị trạng thái y lệnh và các mutation thực hiện/hủy tương ứng.
 *
 * @param order Y lệnh từ `useOrders`, gồm trạng thái và cảnh báo dị ứng do server cung cấp.
 * @remarks `done`, `cancelled`, `blocked` và `delayed` là các trạng thái terminal/đặc biệt được
 * render read-only; trạng thái còn thao tác sẽ hiển thị error inline và modal lý do khi hủy.
 * Checkbox thử da chỉ là dữ liệu hiển thị hiện tại, không tự gửi mutation.
 */
function OrderStatus({ order }: { order: OrderDto }) {
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      {errorMessage && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-[#ba1a1a]" role="alert">
          {errorMessage}
        </p>
      )}
      <label className="flex items-start gap-2 text-xs font-semibold leading-4 text-[#3f4851]">
        <input className="mt-0.5 h-4 w-4 rounded border-[#bfc7d2]" type="checkbox" />
        Đã test da – Kết quả: ÂM TÍNH
      </label>
      <button
        className={styles.primaryButton}
        type="button"
        disabled={isPending}
        onClick={() => {
          setErrorMessage(null);
          updateStatus(
            { orderId: order.id, status: 'done' },
            {
              onError: (error) =>
                setErrorMessage(getApiErrorMessage(error, 'Không thể xác nhận thực hiện y lệnh.')),
            },
          );
        }}
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
              {
                onSuccess: () => {
                  setShowCancelModal(false);
                  setErrorMessage(null);
                },
                onError: (error) =>
                  setErrorMessage(getApiErrorMessage(error, 'Không thể hủy y lệnh.')),
              },
            );
          }}
        />
      )}
    </div>
  );
}

/**
 * Đổi thời điểm ISO sang ca theo giờ địa phương của trình duyệt: 06-14 sáng, 14-22 chiều, còn lại tối.
 */
function getOrderShift(iso: string): 'Sáng' | 'Chiều' | 'Tối' {
  const hour = new Date(iso).getHours();
  if (hour >= 6 && hour < 14) return 'Sáng';
  if (hour >= 14 && hour < 22) return 'Chiều';
  return 'Tối';
}

/**
 * Hiển thị danh sách y lệnh và kế hoạch chăm sóc theo buồng, ca, loại và từ khóa.
 *
 * @remarks Y lệnh lấy từ `useOrders`; hook tự refetch mỗi 15 giây, còn thống kê và bộ lọc được tính
 * ở client trên server-state. Không có polling/local timer riêng trong screen.
 * Screen có loading và trạng thái không tìm thấy; thao tác thực hiện/hủy, lỗi và trạng thái dị ứng
 * được xử lý tại `OrderStatus`. UI visibility của lane không thay thế authorization backend.
 */
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
  const pendingCount = ordersList.filter(
    (o) => o.status === 'active' || o.status === 'pending',
  ).length;
  const doneCount = ordersList.filter((o) => o.status === 'done').length;
  const cancelledCount = ordersList.filter((o) => o.status === 'cancelled').length;
  const allergyCount = ordersList.filter((o) => o.hasAllergyWarning).length;

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

  const roomOptions = Array.from(new Set(ordersList.map((o) => o.roomLabel))).sort();

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
                <tr className={cn(order.status === 'blocked' && 'bg-red-50/30')} key={order.id}>
                  <td className={styles.td}>
                    <p
                      className={cn(
                        'text-base font-bold',
                        order.status === 'pending' || order.status === 'active'
                          ? 'text-[#006096]'
                          : 'text-[#171c1f]',
                      )}
                    >
                      {new Date(order.time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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

/**
 * Bản nháp chuẩn hóa danh tính cấp cứu; ngày sinh dùng chuỗi `YYYY-MM-DD`, số điện thoại tối đa
 * 10 chữ số, CCCD tối đa 12 chữ số và `privacyConfirmed` phải được xác nhận trước khi gửi.
 */
type EmergencyIdentityFormState = {
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  phoneNumber: string;
  identityCardNumber: string;
  address: string;
  healthInsuranceCode: string;
  guardianFullName: string;
  guardianPhoneNumber: string;
  privacyConfirmed: boolean;
};

/** Giá trị mặc định an toàn cho form danh tính; chọn `male` ban đầu nhưng không mặc định đồng ý
 * dữ liệu. */
const emptyEmergencyForm: EmergencyIdentityFormState = {
  fullName: '',
  dateOfBirth: '',
  gender: 'male',
  phoneNumber: '',
  identityCardNumber: '',
  address: '',
  healthInsuranceCode: '',
  guardianFullName: '',
  guardianPhoneNumber: '',
  privacyConfirmed: false,
};

/** Định dạng thời điểm vào viện theo locale `vi-VN`, giữ chuỗi gốc nếu ISO không hợp lệ. */
function formatAdmittedAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleTimeString('vi-VN')} - ${d.toLocaleDateString('vi-VN')}`;
}

/**
 * Chuẩn hóa danh tính cho các ca cấp cứu vô danh trước khi đóng hồ sơ hoặc xuất viện.
 *
 * @remarks Danh sách ca lấy từ `useUnidentifiedEmergencyPatients`; hook quản lý cache/retry và
 * screen không tự tạo polling. Bệnh nhân chọn và form là local state. Screen có loading, empty và toast
 * success/error; submit chỉ gửi sau validation client rồi mutation chuẩn hóa server-state. Effect
 * tự chọn ca đầu tiên khi danh sách mới có dữ liệu. Đây là
 * UI boundary của điều dưỡng, không thay thế quyền và validation bảo vệ dữ liệu cá nhân ở backend.
 */
function EmergencyScreen() {
  const { data: unidentifiedPatients, isLoading } = useUnidentifiedEmergencyPatients();
  const { mutate: standardizeIdentity, isPending } = useStandardizeEmergencyIdentity();

  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [form, setForm] = useState<EmergencyIdentityFormState>(emptyEmergencyForm);
  type EmergencyFieldName =
    | 'fullName'
    | 'dateOfBirth'
    | 'phoneNumber'
    | 'identityCardNumber'
    | 'guardianFullName'
    | 'guardianPhoneNumber'
    | 'privacyConfirmed';
  const [touchedFields, setTouchedFields] = useState<Partial<Record<EmergencyFieldName, boolean>>>(
    {},
  );
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const { hideToast, showToast, toast } = useAppToast(3000);

  const patients = useMemo(() => unidentifiedPatients ?? [], [unidentifiedPatients]);

  // Đồng bộ lựa chọn cục bộ với danh sách ca server khi danh sách chuyển từ rỗng sang có dữ liệu.
  // Không reset lựa chọn hiện tại nếu ca đó vẫn tồn tại, nên không cần cleanup.
  useEffect(() => {
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].patientId);
    }
  }, [patients, selectedPatientId]);

  const selectedPatient = patients.find((p) => p.patientId === selectedPatientId) ?? null;

  const errors = useMemo(
    () => getVisibleEmergencyIdentityErrors(form, touchedFields, attemptedSubmit),
    [attemptedSubmit, form, touchedFields],
  );

  /**
   * Nhận thay đổi từ input, hạ cờ touched của trường liên quan và cập nhật local draft.
   * Validation đầy đủ chạy ở submit; việc chuẩn hóa chữ số/hoa được thực hiện tại callback field.
   */
  const handleFieldChange = <FieldName extends keyof EmergencyIdentityFormState>(
    field: FieldName,
    value: EmergencyIdentityFormState[FieldName],
  ) => {
    setTouchedFields((previous) => {
      if (
        field === 'identityCardNumber' ||
        field === 'guardianFullName' ||
        field === 'guardianPhoneNumber'
      ) {
        return {
          ...previous,
          identityCardNumber: false,
          guardianFullName: false,
          guardianPhoneNumber: false,
        };
      }
      return { ...previous, [field]: false };
    });
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  // Blur mở lỗi inline cho trường; nhóm CCCD/người bảo hộ được kiểm tra cùng nhau theo rule
  // nghiệp vụ.
  const handleFieldBlur = (field: EmergencyFieldName) => {
    setTouchedFields((previous) => {
      if (
        field === 'identityCardNumber' ||
        field === 'guardianFullName' ||
        field === 'guardianPhoneNumber'
      ) {
        return {
          ...previous,
          identityCardNumber: true,
          guardianFullName: true,
          guardianPhoneNumber: true,
        };
      }
      return { ...previous, [field]: true };
    });
  };

  // Đổi ca phải xóa toàn bộ draft danh tính để không trộn dữ liệu nhạy cảm giữa hai bệnh nhân.
  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setForm(emptyEmergencyForm);
    setTouchedFields({});
    setAttemptedSubmit(false);
  };

  // Làm mới chỉ reset local draft và trạng thái validation, không thay đổi danh sách server.
  const handleReset = () => {
    setForm(emptyEmergencyForm);
    setTouchedFields({});
    setAttemptedSubmit(false);
  };

  /**
   * Xử lý submit form danh tính: guard ca đang chọn/mutation, validate bắt buộc rồi gửi mutation.
   * Thành công reset form và lựa chọn; lỗi conflict/API được ánh xạ thành toast để người dùng sửa
   * hoặc thử lại, không ghi dữ liệu nhạy cảm vào comment hay log.
   */
  const handleSubmit = () => {
    if (!selectedPatient || isPending) return;

    setAttemptedSubmit(true);
    const nextErrors = validateEmergencyIdentity(form);

    if (Object.keys(nextErrors).length > 0) return;

    standardizeIdentity(
      {
        patientId: selectedPatient.patientId,
        fullName: form.fullName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        phoneNumber: form.phoneNumber,
        identityCardNumber: form.identityCardNumber.trim() || undefined,
        address: form.address.trim() || undefined,
        healthInsuranceCode: form.healthInsuranceCode.trim() || undefined,
        guardianFullName: form.guardianFullName.trim() || undefined,
        guardianPhoneNumber: form.guardianPhoneNumber.trim() || undefined,
        privacyConfirmed: true,
      },
      {
        onSuccess: () => {
          showToast('Đã chuẩn hóa danh tính bệnh nhân thành công!', 'success');
          setForm(emptyEmergencyForm);
          setTouchedFields({});
          setAttemptedSubmit(false);
          setSelectedPatientId('');
        },
        onError: (error) => {
          showToast(
            error instanceof ApiError && error.code === 'CONFLICT_ERROR'
              ? 'Số CCCD này đã được dùng cho bệnh nhân khác trên hệ thống — vui lòng kiểm tra lại hoặc mở hồ sơ bệnh nhân hiện có'
              : error instanceof ApiError
                ? error.message
                : 'Chuẩn hóa danh tính thất bại, vui lòng thử lại!',
            'error',
          );
        },
      },
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
      <AppToast message={toast.message} onClose={hideToast} tone={toast.tone} />

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
          <Card
            count={`${patients.length} ca`}
            icon="alert"
            title="Bệnh nhân vô danh chưa xác định"
          >
            <div className="divide-y divide-[#eaeef2]">
              {patients.map((p) => {
                const isSelected = p.patientId === selectedPatientId;
                return (
                  <button
                    className={cn(
                      'flex w-full gap-3 p-4 text-left',
                      isSelected ? 'border-l-4 border-l-[#ba1a1a] bg-red-700/5' : 'opacity-70',
                    )}
                    key={p.patientId}
                    type="button"
                    onClick={() => handleSelectPatient(p.patientId)}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        isSelected ? 'bg-rose-200 text-[#ba1a1a]' : 'bg-gray-100 text-gray-400',
                      )}
                    >
                      <Icon name="user" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold leading-4 text-gray-900">
                        {p.tempName}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#3f4851]">
                        STT {String(p.sttNumber).padStart(2, '0')}
                        {p.bedLabel ? ` • Giường ${p.bedLabel}` : ''}
                        {p.roomLabel ? ` • ${p.roomLabel}` : ''}
                      </span>
                      <span
                        className={cn(
                          'mt-1 block text-[10px] font-bold leading-5',
                          isSelected ? 'text-[#ba1a1a]' : 'text-gray-400',
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
                Biểu mẫu chuẩn hóa danh tính – STT{' '}
                {String(selectedPatient?.sttNumber ?? 0).padStart(2, '0')}
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
                  onChange={(v) => handleFieldChange('fullName', v.toUpperCase())}
                  onBlur={() => handleFieldBlur('fullName')}
                  placeholder="NHẬP HỌ TÊN (TỰ CHUYỂN HOA CÓ DẤU)"
                  error={errors.fullName}
                  maxLength={255}
                />
                <Field
                  label="Ngày sinh"
                  required
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(v) => handleFieldChange('dateOfBirth', v)}
                  onBlur={() => handleFieldBlur('dateOfBirth')}
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
                            active ? 'border-[#006096] bg-sky-50' : 'border-[#d1d5db] bg-white',
                          )}
                          key={g}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, gender: g }))}
                        >
                          <span
                            className={cn(
                              'h-4 w-4 rounded-full border p-1',
                              active ? 'border-[#006096] bg-[#006096]' : 'border-gray-500',
                            )}
                          >
                            {active && (
                              <span className="block h-full w-full rounded-full bg-white" />
                            )}
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
                    handleFieldChange('phoneNumber', v.replace(/\D/g, '').slice(0, 10))
                  }
                  onBlur={() => handleFieldBlur('phoneNumber')}
                  placeholder="0901234567"
                  error={errors.phoneNumber}
                />
                <Field
                  label="Số CCCD (12 chữ số)"
                  value={form.identityCardNumber}
                  onChange={(v) =>
                    handleFieldChange('identityCardNumber', v.replace(/\D/g, '').slice(0, 12))
                  }
                  onBlur={() => handleFieldBlur('identityCardNumber')}
                  placeholder="001234567890"
                  error={errors.identityCardNumber}
                />
                <Field
                  label="Địa chỉ thường trú / tạm trú"
                  value={form.address}
                  onChange={(v) => setForm((prev) => ({ ...prev, address: v }))}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  maxLength={500}
                />
                <Field
                  label="Mã thẻ BHYT (nếu có)"
                  value={form.healthInsuranceCode}
                  onChange={(v) => setForm((prev) => ({ ...prev, healthInsuranceCode: v }))}
                  placeholder="DN3501234567890"
                  maxLength={20}
                />
                <Field
                  label="Họ tên người bảo hộ / liên hệ"
                  value={form.guardianFullName}
                  onChange={(v) => handleFieldChange('guardianFullName', v)}
                  onBlur={() => handleFieldBlur('guardianFullName')}
                  placeholder="Họ và tên người thân"
                  error={errors.guardianFullName}
                  maxLength={255}
                />
                <Field
                  label="Số điện thoại người giám hộ / đại diện"
                  value={form.guardianPhoneNumber}
                  onChange={(v) =>
                    handleFieldChange('guardianPhoneNumber', v.replace(/\D/g, '').slice(0, 10))
                  }
                  onBlur={() => handleFieldBlur('guardianPhoneNumber')}
                  placeholder="0912345678"
                  error={errors.guardianPhoneNumber}
                  maxLength={10}
                />
              </div>
              <label className="flex items-start gap-3 rounded-sm border border-gray-200 bg-gray-50 p-3 text-xs leading-4 text-gray-600">
                <input
                  className="mt-0.5 h-4 w-4 rounded border-gray-500"
                  type="checkbox"
                  checked={form.privacyConfirmed}
                  onChange={(e) => handleFieldChange('privacyConfirmed', e.target.checked)}
                  onBlur={() => handleFieldBlur('privacyConfirmed')}
                />
                <span>
                  Xác nhận bệnh nhân/người nhà đã đồng ý cung cấp thông tin và ký bản cam kết bảo
                  mật theo
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

/**
 * Trường text dùng chung cho form danh tính, hiển thị lỗi inline và giới hạn ký tự nếu có.
 *
 * @param label Nhãn field nghiệp vụ.
 * @param required Hiển thị dấu bắt buộc, không thay thế validation.
 * @param value Giá trị draft hiện tại.
 * @param onChange Callback nhận chuỗi từ input.
 * @param onBlur Callback tùy chọn để cập nhật touched/validation.
 * @param error Lỗi đã chuẩn hóa cần hiển thị.
 * @param maxLength Giới hạn ký tự của field nếu API/type yêu cầu.
 */
function Field({
  label,
  required = false,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  error,
  maxLength,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  error?: string;
  maxLength?: number;
}) {
  return (
    <label>
      <span className={styles.label}>
        {label} {required && <span className="text-[#ba1a1a]">*</span>}
      </span>
      <input
        className={cn(
          styles.input,
          error && 'border-red-400 text-[#ba1a1a] focus:border-red-500 focus:ring-red-500/10',
        )}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        type={type}
        value={value}
        maxLength={maxLength}
      />
      {error && (
        <p className="mt-1 text-xs font-bold text-[#ba1a1a]" role="alert">
          {error}
        </p>
      )}
    </label>
  );
}

/** Chọn screen theo lane hiện tại; `vitals` là fallback khi giá trị không thuộc lane khác. */
function ActiveScreen({ activeScreen }: { activeScreen: NurseScreen }) {
  if (activeScreen === 'samples') return <SamplesScreen />;
  if (activeScreen === 'beds') return <BedsScreen />;
  if (activeScreen === 'orders') return <OrdersScreen />;
  if (activeScreen === 'emergency') return <EmergencyScreen />;

  return <VitalsScreen />;
}

/**
 * Shell workspace của điều dưỡng, điều phối các lane sinh hiệu, mẫu, giường, y lệnh và cấp cứu.
 *
 * @remarks Page mặc định ở lane `vitals`; Sidebar gọi callback đổi lane và Topbar hiển thị ngữ
 * cảnh. Dữ liệu, loading, empty, success/error và mutation do từng screen/hook sở hữu; shell chỉ
 * bọc layout và năm footer. Việc ẩn/hiện lane trên UI không thay thế authorization ở backend.
 */
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
