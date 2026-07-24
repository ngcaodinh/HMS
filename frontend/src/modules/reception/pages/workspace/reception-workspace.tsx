'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getApiErrorMessage } from '@/shared/api-client/api-client';
import { AppToast } from '@/shared/components/app-toast';
import {
  callNextQueueTicket,
  issueDeskTicket,
  listQueueTickets,
  reannounceQueueTicket,
  recallQueueTicket,
  skipQueueTicket,
} from '@/modules/queue/services/queue.api';
import type { QueueTicketDto } from '@/modules/queue/types';
import {
  emptyNewPatientForm,
  IDENTITY_CARD_REGEX,
  MAX_QUEUE_CALL_ATTEMPTS,
  VN_MOBILE_PHONE_REGEX,
} from '@/modules/reception/constants/reception.constants';
import {
  createEmergencyAdmission,
  createReception,
  listReceptionDoctors,
  searchPatients,
} from '@/modules/reception/services/reception.api';
import type {
  DoctorOption,
  Gender,
  NewPatientForm,
  PatientSearchResult,
} from '@/modules/reception/types/reception.types';

import { receptionWorkspaceStyles as styles } from './reception-workspace.styles';

type WorkspaceMode = 'empty' | 'queue' | 'emergency';
type QueueTab = 'waiting' | 'skipped';

type IconProps = {
  className?: string;
};

type FieldProps = {
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
};

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

function getLegalDateString(reference: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(reference);
}

function formatTicketNumber(ticketNumber: number) {
  return String(ticketNumber).padStart(4, '0');
}

function formatTicketTime(iso: string | null) {
  if (!iso) {
    return '--:--';
  }
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    timeZone: VIETNAM_TIME_ZONE,
  }).format(new Date(iso));
}

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `desk-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function QueueIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M5 7h14M5 12h10M5 17h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function EmergencyIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  );
}

function LogoutIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6.5A1.5 1.5 0 0 1 10 18.5V17M4 12h10m0 0-3-3m3 3-3 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MaleIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="10" cy="14" r="5" stroke="currentColor" strokeWidth="2" />
      <path
        d="m14 10 6-6m0 0h-5m5 0v5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function FemaleIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="2" />
      <path d="M12 14v7m-4-3.5h8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="m5 12.5 4.25 4.25L19 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.3"
      />
    </svg>
  );
}

function Sidebar({
  mode,
  onChangeMode,
}: {
  mode: WorkspaceMode;
  onChangeMode: (mode: WorkspaceMode) => void;
}) {
  const isEmergency = mode === 'emergency';

  return (
    <aside
      className={cn(styles.sidebar, isEmergency && styles.sidebarEmergency)}
      suppressHydrationWarning
    >
      <div className={styles.sidebarHeader}>
        <div className="flex min-w-0 items-center gap-2">
          <div className={styles.logoWrap}>
            <Image
              alt="HMS-VN"
              className="h-full w-full object-cover"
              height={34}
              priority
              src="/hms-login-logo.png"
              width={34}
            />
          </div>
          <div className="min-w-0">
            <p className={styles.brandName}>HMS-VN</p>
            <p className={styles.brandSubtitle}>HỆ THỐNG QUẢN LÝ BỆNH VIỆN</p>
          </div>
        </div>
      </div>

      <nav
        aria-label="Phân hệ lễ tân"
        className={cn(styles.nav, isEmergency && styles.navEmergency)}
        suppressHydrationWarning
      >
        <button
          className={cn(
            styles.navItem,
            mode !== 'emergency' ? styles.navItemActive : styles.navItemQueueInactive,
          )}
          onClick={() => onChangeMode(mode === 'empty' ? 'queue' : 'empty')}
          suppressHydrationWarning
          type="button"
        >
          <span
            className={cn(
              styles.navIcon,
              isEmergency ? styles.navIconQueueEmergency : styles.navIconQueue,
            )}
          >
            <QueueIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0">
            <span
              className={cn(
                styles.navTitle,
                mode !== 'emergency' ? 'text-white' : 'text-[#ffcdd2]',
              )}
            >
              Hàng đợi & Tiếp đón
            </span>
            <span
              className={cn(
                styles.navSubtitle,
                mode !== 'emergency' ? 'block text-[#8c99a3]' : 'block text-[#ef9a9a]',
              )}
            >
              Gọi số · Nhập hồ sơ
            </span>
          </span>
        </button>

        <button
          className={cn(
            styles.navItem,
            mode === 'emergency' ? styles.navItemEmergencyActive : styles.navItemEmergency,
          )}
          onClick={() => onChangeMode('emergency')}
          suppressHydrationWarning
          type="button"
        >
          <span className={cn(styles.navIcon, styles.navIconEmergency)}>
            <EmergencyIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0">
            <span className={styles.navTitle}>Tiếp nhận Cấp cứu</span>
            <span className={cn(styles.navSubtitle, 'block text-[#e57373]')}>
              {mode === 'emergency' ? 'Bypass định danh' : 'Khẩn cấp'}
            </span>
          </span>
        </button>
      </nav>

      <div className={cn(styles.sidebarUser, isEmergency && styles.sidebarUserEmergency)}>
        <div className={styles.userAvatar}>CĐ</div>
        <div className="min-w-0">
          <p className={styles.userName}>Nguyễn Cao Đỉnh</p>
          <p className={styles.userRole}>Lễ Tân</p>
        </div>
        <button
          aria-label="Đăng xuất"
          className={styles.logoutButton}
          suppressHydrationWarning
          type="button"
        >
          <LogoutIcon className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

function Topbar({ mode }: { mode: WorkspaceMode }) {
  const isEmergency = mode === 'emergency';
  const title = isEmergency ? 'Tiếp nhận Cấp cứu' : 'Hàng đợi & Tiếp đón';
  const time = mode === 'empty' ? '09:11' : isEmergency ? '02:05' : '02:11';

  return (
    <header className={styles.topbar}>
      <div className="flex min-w-0 items-center gap-2.5">
        <h1 className={styles.topbarTitle}>{title}</h1>
        <span
          className={cn(
            styles.topbarMeta,
            isEmergency
              ? 'border-[rgba(198,40,40,0.25)] bg-[rgba(198,40,40,0.09)] text-[#c62828]'
              : 'border-[rgba(0,96,150,0.2)] bg-[rgba(0,96,150,0.09)] text-[#006096]',
          )}
        >
          <span
            className={cn(
              'h-[7px] w-[7px] rounded-full',
              isEmergency ? 'bg-[#c62828]' : 'bg-[#22a84b]',
            )}
          />
          {isEmergency ? 'CHẾ ĐỘ CẤP CỨU' : 'Ca sáng · 7:00–12:00'}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <span className={styles.topbarClock}>{time}</span>
        {!isEmergency && (
          <span
            className={cn(
              styles.topbarMeta,
              'border-[rgba(0,96,150,0.2)] bg-[rgba(0,96,150,0.09)] text-[#006096]',
            )}
          >
            <span className="h-[7px] w-[7px] rounded-full bg-[#22a84b]" />
            Trực tuyến
          </span>
        )}
      </div>
    </header>
  );
}

function EmptyQueueWorkspace({ onStart }: { onStart: () => void }) {
  return (
    <section className={styles.emptyState}>
      <QueueIcon className={styles.emptyIcon} />
      <div>
        <h2 className={styles.emptyTitle}>Hàng đợi & Tiếp đón</h2>
        <p className={styles.emptyDescription}>Quản lý số thứ tự và hồ sơ tiếp nhận ban đầu.</p>
      </div>
      <button className={styles.primaryButton} onClick={onStart} type="button">
        Gọi số ngay
      </button>
    </section>
  );
}

type QueueTicketPanelProps = {
  activeTicket: QueueTicketDto | null;
  listVersion?: number;
  onActiveTicketChange: (ticket: QueueTicketDto | null) => void;
};

/**
 * Panel gọi số FIFO — chỉ call-next (MIN number), không gọi số waiting tùy ý.
 * Session số đang gọi là sticky: poll/list không được tự clear (tránh race mất số).
 */
function QueueTicketPanel({
  activeTicket,
  listVersion = 0,
  onActiveTicketChange,
}: QueueTicketPanelProps) {
  const [legalDate, setLegalDate] = useState(() => getLegalDateString());
  const [tab, setTab] = useState<QueueTab>('waiting');
  const [waiting, setWaiting] = useState<QueueTicketDto[]>([]);
  const [skipped, setSkipped] = useState<QueueTicketDto[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deskMessage, setDeskMessage] = useState<string | null>(null);
  /** Số lần đã gọi số hiện tại (1 = call-next, tối đa MAX_QUEUE_CALL_ATTEMPTS). */
  const [callAttemptCount, setCallAttemptCount] = useState(0);
  const callAttemptCountRef = useRef(0);
  const activeTicketRef = useRef(activeTicket);
  activeTicketRef.current = activeTicket;
  const onActiveTicketChangeRef = useRef(onActiveTicketChange);
  onActiveTicketChangeRef.current = onActiveTicketChange;

  /**
   * Đồng bộ session ticket từ server.
   * Chỉ clear khi xác nhận ticket đã skipped/served — không clear khi list miss tạm thời.
   */
  const reconcileActiveTicket = useCallback(
    (calledItems: QueueTicketDto[], skippedItems: QueueTicketDto[]) => {
      const current = activeTicketRef.current;
      if (!current) {
        return;
      }

      const stillCalled = calledItems.find((item) => item.ticketId === current.ticketId);
      if (stillCalled) {
        if (
          stillCalled.calledAt !== current.calledAt ||
          stillCalled.status !== current.status ||
          stillCalled.number !== current.number
        ) {
          activeTicketRef.current = stillCalled;
          onActiveTicketChangeRef.current(stillCalled);
        }
        return;
      }

      const becameSkipped = skippedItems.some((item) => item.ticketId === current.ticketId);
      if (becameSkipped) {
        activeTicketRef.current = null;
        onActiveTicketChangeRef.current(null);
        callAttemptCountRef.current = 0;
        setCallAttemptCount(0);
      }
      // Không clear khi không thấy trong called (race list/page) — giữ session local.
    },
    [],
  );

  const setActiveSession = useCallback(
    (ticket: QueueTicketDto | null, attemptCount = 1) => {
      activeTicketRef.current = ticket;
      onActiveTicketChangeRef.current(ticket);
      const nextCount = ticket ? attemptCount : 0;
      callAttemptCountRef.current = nextCount;
      setCallAttemptCount(nextCount);
    },
    [],
  );

  const refreshLists = useCallback(async () => {
    const date = getLegalDateString();
    setLegalDate(date);

    const [waitingResult, skippedResult, calledResult] = await Promise.all([
      listQueueTickets({ date, status: 'waiting', pageSize: 50 }),
      listQueueTickets({ date, status: 'skipped', pageSize: 50 }),
      listQueueTickets({ date, status: 'called', pageSize: 50 }),
    ]);

    setWaiting(waitingResult.items);
    setSkipped(skippedResult.items);
    reconcileActiveTicket(calledResult.items, skippedResult.items);
  }, [reconcileActiveTicket]);

  useEffect(() => {
    void refreshLists().catch((error: unknown) => {
      setActionError(getApiErrorMessage(error, 'Không tải được hàng đợi'));
    });

    const poll = window.setInterval(() => {
      void refreshLists().catch(() => undefined);
    }, 10000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshLists().catch(() => undefined);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshLists]);

  // Refresh list khi tiếp nhận xong (không remount cả layout)
  useEffect(() => {
    if (listVersion === 0) {
      return;
    }
    void refreshLists().catch(() => undefined);
  }, [listVersion, refreshLists]);

  // Parent clear session (tiếp nhận xong / Hủy) → reset bộ đếm gọi.
  useEffect(() => {
    if (!activeTicket) {
      callAttemptCountRef.current = 0;
      setCallAttemptCount(0);
    }
  }, [activeTicket]);

  const runAction = async (action: () => Promise<void>) => {
    if (isBusy) {
      return;
    }
    setIsBusy(true);
    setActionError(null);
    setDeskMessage(null);
    try {
      await action();
      await refreshLists();
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Thao tác hàng đợi thất bại'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleCallNext = () =>
    runAction(async () => {
      const ticket = await callNextQueueTicket(legalDate);
      // Lần 1/3 — cập nhật ref ngay, tránh poll/refresh xóa session.
      setActiveSession(ticket, 1);
    });

  const handleSkip = () =>
    runAction(async () => {
      const current = activeTicketRef.current;
      if (!current) {
        throw new Error('Chưa có số đang gọi để bỏ qua');
      }
      const attempts = callAttemptCountRef.current;
      if (attempts < MAX_QUEUE_CALL_ATTEMPTS) {
        throw new Error(
          `Cần gọi đủ ${MAX_QUEUE_CALL_ATTEMPTS} lần trước khi bỏ qua (hiện ${attempts}/${MAX_QUEUE_CALL_ATTEMPTS})`,
        );
      }
      await skipQueueTicket(current.ticketId, 'Bệnh nhân không có mặt sau nhiều lần gọi');
      setActiveSession(null, 0);
    });

  /**
   * Gọi lại số đang phục vụ (re-announce). Tối đa MAX lần kể cả call-next.
   */
  const handleReannounce = () =>
    runAction(async () => {
      const current = activeTicketRef.current;
      if (!current) {
        throw new Error('Chưa có số đang gọi để gọi lại');
      }
      const attempts = callAttemptCountRef.current;
      if (attempts >= MAX_QUEUE_CALL_ATTEMPTS) {
        throw new Error(
          `Đã gọi đủ ${MAX_QUEUE_CALL_ATTEMPTS} lần. Có thể bỏ qua nếu bệnh nhân vắng mặt.`,
        );
      }
      const ticket = await reannounceQueueTicket(current.ticketId);
      setActiveSession(ticket, attempts + 1);
    });

  /** Gọi lại số từ danh sách bỏ qua (bắt đầu session mới = lần 1). */
  const handleRecallFromSkipped = (ticketId: string) =>
    runAction(async () => {
      const ticket = await recallQueueTicket(ticketId, 'Bệnh nhân đã quay lại quầy');
      setActiveSession(ticket, 1);
      setTab('waiting');
    });

  const handleDeskIssue = () =>
    runAction(async () => {
      const issued = await issueDeskTicket(createIdempotencyKey());
      setDeskMessage(
        `Đã bốc số ${formatTicketNumber(issued.number)} — vào hàng chờ, gọi theo thứ tự`,
      );
    });

  const list = tab === 'waiting' ? waiting : skipped;
  const hasActiveTicket = Boolean(activeTicket);
  const canReannounce =
    hasActiveTicket && callAttemptCount > 0 && callAttemptCount < MAX_QUEUE_CALL_ATTEMPTS;
  const canSkip = hasActiveTicket && callAttemptCount >= MAX_QUEUE_CALL_ATTEMPTS;
  const remainingRecalls = Math.max(MAX_QUEUE_CALL_ATTEMPTS - callAttemptCount, 0);

  return (
    <aside className={styles.queuePanel}>
      <section className={styles.nowServing}>
        <p className={styles.sectionKicker}>SỐ ĐANG PHỤC VỤ</p>
        <p className={styles.servingNumber}>
          {activeTicket ? formatTicketNumber(activeTicket.number) : '----'}
        </p>
        <p className={styles.servingDesk}>Quầy Tiếp Nhận · {legalDate}</p>
        <span className={styles.statusPill}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#006096]" />
          {activeTicket
            ? `Đang gọi · lần ${callAttemptCount}/${MAX_QUEUE_CALL_ATTEMPTS}`
            : 'Chờ gọi số'}
        </span>
      </section>

      <section className={styles.queueActions}>
        <button
          className={cn(styles.primaryButton, 'mb-2 w-full rounded-[10px] py-3 uppercase')}
          disabled={isBusy || waiting.length === 0 || hasActiveTicket}
          onClick={() => {
            void handleCallNext();
          }}
          type="button"
        >
          GỌI SỐ TIẾP THEO
        </button>
        <p className="mb-2 text-center text-[10px] font-medium text-[#707882]">
          Gọi số chờ <strong>nhỏ nhất</strong>. Mỗi số gọi tối đa{' '}
          <strong>{MAX_QUEUE_CALL_ATTEMPTS} lần</strong> rồi mới bỏ qua.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={styles.secondaryButton}
            disabled={isBusy || !canReannounce}
            onClick={() => {
              void handleReannounce();
            }}
            type="button"
          >
            {hasActiveTicket
              ? `Gọi lại (${callAttemptCount}/${MAX_QUEUE_CALL_ATTEMPTS})`
              : 'Gọi lại'}
          </button>
          <button
            className={styles.dangerOutlineButton}
            disabled={isBusy || !canSkip}
            onClick={() => {
              void handleSkip();
            }}
            title={
              hasActiveTicket && !canSkip
                ? `Cần gọi đủ ${MAX_QUEUE_CALL_ATTEMPTS} lần (còn ${remainingRecalls} lần gọi lại)`
                : undefined
            }
            type="button"
          >
            Bỏ qua
          </button>
        </div>
        {hasActiveTicket && !canSkip ? (
          <p className="mt-2 text-center text-[10px] font-medium text-[#895500]">
            Còn {remainingRecalls} lần gọi lại trước khi được bỏ qua.
          </p>
        ) : null}
        {hasActiveTicket && canSkip ? (
          <p className="mt-2 text-center text-[10px] font-medium text-[#ba1a1a]">
            Đã gọi đủ {MAX_QUEUE_CALL_ATTEMPTS} lần — có thể bỏ qua nếu vắng mặt.
          </p>
        ) : null}
        <button
          className={cn(styles.mutedButton, 'mt-2 w-full')}
          disabled={isBusy}
          onClick={() => {
            void handleDeskIssue();
          }}
          type="button"
        >
          Bốc số tại quầy
        </button>
        {actionError ? (
          <p className="mt-2 text-[11px] font-medium text-[#ba1a1a]">{actionError}</p>
        ) : null}
        {deskMessage ? (
          <p className="mt-2 text-[11px] font-medium text-[#006096]">{deskMessage}</p>
        ) : null}
      </section>

      <div className={styles.queueTabs}>
        <button
          className={cn(styles.queueTab, tab === 'waiting' && styles.queueTabActive)}
          onClick={() => setTab('waiting')}
          type="button"
        >
          Đang chờ{' '}
          <span className="rounded-full bg-[#cee5ff] px-1.5 py-0.5 text-[9px]">
            {waiting.length}
          </span>
        </button>
        <button
          className={cn(styles.queueTab, tab === 'skipped' && styles.queueTabActive)}
          onClick={() => setTab('skipped')}
          type="button"
        >
          Bỏ qua{' '}
          <span className="rounded-full bg-[#eaeef2] px-1.5 py-0.5 text-[9px]">
            {skipped.length}
          </span>
        </button>
      </div>

      <div className={styles.queueList}>
        {list.length === 0 ? (
          <p className="px-2 py-3 text-[12px] text-[#707882]">Không có số trong danh sách.</p>
        ) : (
          list.map((ticket) => (
            <div className={styles.queueItem} key={ticket.ticketId}>
              <p className={styles.queueNumber}>{formatTicketNumber(ticket.number)}</p>
              <p className={styles.queueTime}>
                {tab === 'waiting'
                  ? `Số ${formatTicketNumber(ticket.number)}`
                  : `Gọi lúc ${formatTicketTime(ticket.calledAt)}`}
              </p>
              {tab === 'skipped' ? (
                <button
                  className={styles.callButton}
                  disabled={isBusy || hasActiveTicket}
                  onClick={() => {
                    void handleRecallFromSkipped(ticket.ticketId);
                  }}
                  type="button"
                >
                  Gọi
                </button>
              ) : (
                <span className="text-[10px] font-semibold text-[#707882]">Chờ</span>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function Field({
  label,
  placeholder,
  required = false,
  type = 'text',
  value = '',
  disabled = false,
  onChange,
}: FieldProps) {
  return (
    <label className="block">
      <span className={styles.fieldLabel}>
        {label} {required && <span className={styles.required}>*</span>}
      </span>
      <input
        className={styles.input}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

type PatientReceptionFormProps = {
  activeTicket: QueueTicketDto | null;
  onClearSession: () => void;
  onReceptionSuccess: (message: string) => void;
  onReceptionError: (message: string) => void;
};

/**
 * Form tiếp nhận — bind ticket called + search/create patient + POST /receptions.
 * Có session số đang gọi thì cho nhập form; chỉ khóa khi đang submit.
 */
function PatientReceptionForm({
  activeTicket,
  onClearSession,
  onReceptionSuccess,
  onReceptionError,
}: PatientReceptionFormProps) {
  // Session local sau call-next luôn là called; không khóa form vì status flicker.
  const canComplete = Boolean(
    activeTicket && activeTicket.status !== 'served' && activeTicket.status !== 'skipped',
  );
  const [form, setForm] = useState<NewPatientForm>({ ...emptyNewPatientForm });
  const [doctorId, setDoctorId] = useState('');
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
  const [existingPatientId, setExistingPatientId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [noPhone, setNoPhone] = useState(false);

  useEffect(() => {
    void listReceptionDoctors()
      .then((items) => {
        setDoctors(items);
        if (items[0]) {
          setDoctorId(items[0].id);
        }
      })
      .catch(() => {
        setDoctors([]);
      });
  }, []);

  const updateForm = <K extends keyof NewPatientForm>(key: K, value: NewPatientForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setExistingPatientId(null);
  };

  const resetFormFields = () => {
    setForm({ ...emptyNewPatientForm });
    setChiefComplaint('');
    setSearchQuery('');
    setSearchResults([]);
    setExistingPatientId(null);
    setNoPhone(false);
    setFormError(null);
  };

  const resetForm = () => {
    resetFormFields();
    onClearSession();
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      setFormError('Nhập họ tên, SĐT hoặc CCCD để tìm');
      return;
    }

    setIsSearching(true);
    setFormError(null);
    try {
      const params: {
        fullName?: string;
        phoneNumber?: string;
        identityCardNumber?: string;
      } = {};

      if (/^\d{12}$/.test(q)) {
        params.identityCardNumber = q;
      } else if (/^\d{10}$/.test(q)) {
        params.phoneNumber = q;
      } else {
        params.fullName = q;
      }

      const result = await searchPatients(params);
      setSearchResults(result.items);
      if (result.items.length === 0) {
        setFormError('Không tìm thấy bệnh nhân. Tiếp tục tạo mới.');
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Tìm bệnh nhân thất bại'));
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectExistingPatient = (patient: PatientSearchResult) => {
    setExistingPatientId(patient.patientId);
    setForm((prev) => ({
      ...prev,
      fullName: patient.fullName.replace(/\*/g, ''),
      dateOfBirth: patient.dateOfBirth,
    }));
    setFormError(null);
  };

  const validateBeforeSubmit = (): string | null => {
    if (!activeTicket || !canComplete) {
      return 'Cần gọi số theo thứ tự trước khi tiếp nhận';
    }
    if (!doctorId) {
      return 'Vui lòng chọn bác sĩ khám';
    }
    if (existingPatientId) {
      return null;
    }
    if (!form.fullName.trim()) {
      return 'Họ và tên là bắt buộc';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth)) {
      return 'Ngày sinh phải dạng YYYY-MM-DD';
    }
    if (!form.privacyNoticeAccepted) {
      return 'Cần xác nhận thông báo bảo vệ dữ liệu cá nhân';
    }
    const phone = form.phoneNumber.trim();
    if (phone) {
      if (!VN_MOBILE_PHONE_REGEX.test(phone)) {
        return 'Số điện thoại phải 10 số đầu di động Việt Nam';
      }
    } else if (!noPhone || !form.phoneNumberUnavailableReason.trim()) {
      return 'Nhập SĐT hoặc tích không có SĐT và ghi lý do';
    }
    const cccd = form.identityCardNumber.trim();
    if (cccd && !IDENTITY_CARD_REGEX.test(cccd)) {
      return 'CCCD phải đủ 12 chữ số';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateBeforeSubmit();
    if (validationError) {
      setFormError(validationError);
      onReceptionError(validationError);
      return;
    }
    if (!activeTicket) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const body: Parameters<typeof createReception>[0] = {
        queueTicketId: activeTicket.ticketId,
        doctorId,
        chiefComplaint: chiefComplaint.trim() || undefined,
      };

      if (existingPatientId) {
        body.existingPatientId = existingPatientId;
      } else {
        body.newPatient = {
          fullName: form.fullName.trim(),
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          phoneNumber: noPhone ? null : form.phoneNumber.trim() || null,
          phoneNumberUnavailableReason: noPhone
            ? form.phoneNumberUnavailableReason.trim() || 'Không có số điện thoại cá nhân'
            : null,
          identityCardNumber: form.identityCardNumber.trim() || null,
          address: form.address.trim() || null,
          healthInsuranceCode: form.healthInsuranceCode.trim() || null,
          healthInsuranceExpiryDate: form.healthInsuranceExpiryDate.trim() || null,
          privacyNoticeAccepted: true,
        };
      }

      const result = await createReception(body);
      const toastMsg = `Tiếp nhận thành công · ${result.patient.patientCode} · ${result.medicalRecord.recordCode}`;
      resetFormFields();
      // Toast ở parent (sống sau remount form)
      onReceptionSuccess(toastMsg);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Tiếp nhận thất bại — không lưu được hồ sơ');
      setFormError(message);
      onReceptionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Khóa field khi chưa có session số hoặc đang submit (không khóa vì status flicker).
  const fieldsDisabled = !canComplete || isSubmitting;

  return (
    <section className={styles.formArea}>
      <div className={styles.formScroll}>
        <div className={styles.infoStrip}>
          <div>
            <p className="text-[11px] font-medium leading-normal text-[#3f4851]">
              Đang làm thủ tục cho
            </p>
            <p className="text-[18px] font-black leading-normal text-[#006096]">
              {activeTicket
                ? `Số ${formatTicketNumber(activeTicket.number)} · Quầy tiếp nhận`
                : 'Chưa gọi số — bấm “Gọi số tiếp theo”'}
            </p>
            {activeTicket ? (
              <p className="mt-0.5 text-[11px] text-[#707882]">
                Gọi lúc {formatTicketTime(activeTicket.calledAt)}
              </p>
            ) : null}
          </div>
          <span className={styles.statusPill}>{activeTicket ? 'Đang gọi' : 'Chờ số'}</span>
        </div>

        {!canComplete ? (
          <div className="mb-3 rounded-lg border border-[#ffcdd2] bg-[#fff5f5] px-3 py-2 text-[12px] font-medium text-[#c62828]">
            Chỉ tiếp nhận bệnh nhân có số <strong>đang được gọi</strong> theo đúng thứ tự hàng đợi.
            Bấm <strong>Gọi số tiếp theo</strong> bên trái để mở form nhập liệu.
          </div>
        ) : null}

        {formError ? (
          <div className="mb-3 rounded-lg border border-[#ffcdd2] bg-[#fff5f5] px-3 py-2 text-[12px] font-medium text-[#c62828]">
            {formError}
          </div>
        ) : null}

        <div className={styles.formCard}>
          <div className="mb-3 flex gap-2">
            <input
              aria-label="Tìm kiếm bệnh nhân cũ"
              className={styles.input}
              disabled={fieldsDisabled}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Họ tên · Số điện thoại · CCCD..."
              value={searchQuery}
            />
            <button
              className={cn(styles.primaryButton, 'shrink-0 rounded-[10px] px-5')}
              disabled={fieldsDisabled || isSearching}
              onClick={() => {
                void handleSearch();
              }}
              type="button"
            >
              {isSearching ? 'Đang tìm…' : 'Tìm kiếm'}
            </button>
          </div>
          <p className="rounded-lg bg-[#ffeccc] px-3 py-2 text-[11px] font-medium leading-[18px] text-[#895500]">
            Kết quả chỉ hiện thông tin hành chính đã che ký tự nhạy cảm (không MED).
          </p>
          {searchResults.length > 0 ? (
            <ul className="mt-2 max-h-40 space-y-1 overflow-auto">
              {searchResults.map((patient) => (
                <li key={patient.patientId}>
                  <button
                    className="flex w-full items-center justify-between rounded-md border border-[#d7e2eb] bg-white px-3 py-2 text-left text-[12px] hover:bg-[#f6fafe]"
                    disabled={fieldsDisabled}
                    onClick={() => selectExistingPatient(patient)}
                    type="button"
                  >
                    <span>
                      <strong>{patient.patientCode}</strong> · {patient.fullName}
                    </span>
                    <span className="text-[#707882]">{patient.dateOfBirth}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {existingPatientId ? (
            <p className="mt-2 text-[11px] font-semibold text-[#006096]">
              Đang tái khám — patientId đã chọn. Bỏ chọn bằng cách sửa form tạo mới.
            </p>
          ) : null}
        </div>

        <div className={styles.formCard}>
          <p className={styles.formLegend}>THÔNG TIN HÀNH CHÍNH</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                disabled={fieldsDisabled || Boolean(existingPatientId)}
                label="Họ và tên"
                onChange={(value) => updateForm('fullName', value)}
                required
                value={form.fullName}
              />
            </div>
            <Field
              disabled={fieldsDisabled || Boolean(existingPatientId)}
              label="Ngày sinh"
              onChange={(value) => updateForm('dateOfBirth', value)}
              placeholder="YYYY-MM-DD"
              required
              type="date"
              value={form.dateOfBirth}
            />
            <div>
              <p className={styles.fieldLabel}>
                Giới tính <span className={styles.required}>*</span>
              </p>
              <div className="flex gap-2">
                <button
                  className={cn(
                    styles.genderButton,
                    form.gender === 'male' && styles.genderButtonActive,
                  )}
                  disabled={fieldsDisabled || Boolean(existingPatientId)}
                  onClick={() => updateForm('gender', 'male')}
                  type="button"
                >
                  Nam
                </button>
                <button
                  className={cn(
                    styles.genderButton,
                    form.gender === 'female' && styles.genderButtonActive,
                  )}
                  disabled={fieldsDisabled || Boolean(existingPatientId)}
                  onClick={() => updateForm('gender', 'female')}
                  type="button"
                >
                  Nữ
                </button>
              </div>
            </div>
            <Field
              disabled={fieldsDisabled || Boolean(existingPatientId)}
              label="Số CCCD"
              onChange={(value) => updateForm('identityCardNumber', value)}
              placeholder="12 chữ số"
              value={form.identityCardNumber}
            />
            <Field
              disabled={fieldsDisabled || noPhone || Boolean(existingPatientId)}
              label="Số điện thoại"
              onChange={(value) => updateForm('phoneNumber', value)}
              placeholder="09x xxxx xxxx"
              value={form.phoneNumber}
            />
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-[12px] text-[#3f4851]">
                <input
                  checked={noPhone}
                  disabled={fieldsDisabled || Boolean(existingPatientId)}
                  onChange={(event) => {
                    setNoPhone(event.target.checked);
                    if (event.target.checked) {
                      updateForm('phoneNumber', '');
                    }
                  }}
                  type="checkbox"
                />
                Không có SĐT cá nhân (neo đơn / trẻ em / người già — ghi lý do)
              </label>
              {noPhone ? (
                <Field
                  disabled={fieldsDisabled || Boolean(existingPatientId)}
                  label="Lý do không có SĐT"
                  onChange={(value) => updateForm('phoneNumberUnavailableReason', value)}
                  required
                  value={form.phoneNumberUnavailableReason}
                />
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <Field
                disabled={fieldsDisabled || Boolean(existingPatientId)}
                label="Địa chỉ"
                onChange={(value) => updateForm('address', value)}
                value={form.address}
              />
            </div>
          </div>
        </div>

        <div className={styles.formCard}>
          <p className={styles.formLegend}>BẢO HIỂM Y TẾ (BHYT)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              disabled={fieldsDisabled || Boolean(existingPatientId)}
              label="Mã số thẻ BHYT"
              onChange={(value) => updateForm('healthInsuranceCode', value)}
              placeholder="XX XXXXXXXXX XXXX"
              value={form.healthInsuranceCode}
            />
            <Field
              disabled={fieldsDisabled || Boolean(existingPatientId)}
              label="Ngày hết hạn thẻ"
              onChange={(value) => updateForm('healthInsuranceExpiryDate', value)}
              type="date"
              value={form.healthInsuranceExpiryDate}
            />
          </div>
        </div>

        <div className={styles.formCard}>
          <p className={styles.formLegend}>KHÁM & BÁC SĨ</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className={styles.fieldLabel}>
                Bác sĩ khám <span className={styles.required}>*</span>
              </span>
              <select
                className={styles.input}
                disabled={fieldsDisabled}
                onChange={(event) => setDoctorId(event.target.value)}
                value={doctorId}
              >
                <option value="">— Chọn bác sĩ —</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.fullName}
                  </option>
                ))}
              </select>
            </label>
            <Field
              disabled={fieldsDisabled}
              label="Lý do khám"
              onChange={setChiefComplaint}
              value={chiefComplaint}
            />
          </div>
        </div>

        <div className={styles.formCard}>
          <label className={cn(styles.consent, fieldsDisabled && 'cursor-not-allowed opacity-70')}>
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-[#bfc7d2] bg-white text-[#006096]',
                form.privacyNoticeAccepted && 'border-[#006096]',
              )}
            >
              {form.privacyNoticeAccepted ? <CheckIcon className="h-3 w-3" /> : null}
            </span>
            <input
              checked={form.privacyNoticeAccepted}
              className="sr-only"
              disabled={fieldsDisabled || Boolean(existingPatientId)}
              onChange={(event) => updateForm('privacyNoticeAccepted', event.target.checked)}
              type="checkbox"
            />
            <span>Xác nhận bệnh nhân đã đồng ý với thông báo bảo vệ dữ liệu cá nhân.</span>
          </label>
        </div>
      </div>

      <footer className={styles.formFooter}>
        <button
          className={cn(styles.mutedButton, 'px-5 py-3.5 text-[13px]')}
          disabled={isSubmitting}
          onClick={resetForm}
          type="button"
        >
          Hủy / Làm mới
        </button>
        <button
          className={cn(styles.primaryButton, 'rounded-[10px] px-7 py-3 uppercase')}
          disabled={!canComplete || isSubmitting}
          onClick={() => {
            void handleSubmit();
          }}
          type="button"
        >
          {isSubmitting ? 'Đang lưu…' : 'HOÀN TẤT TIẾP NHẬN'}
        </button>
      </footer>
    </section>
  );
}

function QueueWorkspace({
  onToast,
}: {
  onToast: (message: string, tone?: 'success' | 'error') => void;
}) {
  const [activeTicket, setActiveTicket] = useState<QueueTicketDto | null>(null);
  const [listVersion, setListVersion] = useState(0);

  return (
    <section className={styles.queueLayout}>
      <QueueTicketPanel
        activeTicket={activeTicket}
        listVersion={listVersion}
        onActiveTicketChange={setActiveTicket}
      />
      <PatientReceptionForm
        activeTicket={activeTicket}
        onClearSession={() => setActiveTicket(null)}
        onReceptionError={(message) => onToast(message, 'error')}
        onReceptionSuccess={(message) => {
          setActiveTicket(null);
          setListVersion((value) => value + 1);
          onToast(message, 'success');
        }}
      />
    </section>
  );
}

function EmergencyWorkspace({
  onToast,
}: {
  onToast: (message: string, tone?: 'success' | 'error') => void;
}) {
  const [clinicalGender, setClinicalGender] = useState<Gender | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const minReasonLength = 10;
  const canSubmit =
    clinicalGender !== null && reason.trim().length >= minReasonLength && !isSubmitting;
  const remainingCharacters = useMemo(
    () => Math.max(minReasonLength - reason.trim().length, 0),
    [reason],
  );

  const handleActivate = async () => {
    if (!clinicalGender || reason.trim().length < minReasonLength) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createEmergencyAdmission({
        gender: clinicalGender,
        emergencyReason: reason.trim(),
        chiefComplaint: reason.trim(),
      });
      const msg = `Cấp cứu thành công · ${result.patient.fullName} · ${result.patient.patientCode} · ${result.medicalRecord.recordCode}`;
      setClinicalGender(null);
      setReason('');
      onToast(msg, 'success');
    } catch (err) {
      const message = getApiErrorMessage(err, 'Tiếp nhận cấp cứu thất bại');
      setError(message);
      onToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.emergencyBody}>
      <div className={styles.emergencyGlow} />
      <div className={styles.emergencyCard}>
        <div className={styles.emergencyIcon}>
          <EmergencyIcon className="h-8 w-8" />
        </div>
        <h2 className={styles.emergencyTitle}>Tiếp nhận Cấp cứu</h2>
        <p className={styles.emergencyDescription}>
          Bypass định danh — dành cho trường hợp nguy kịch khẩn cấp. Không lấy số kiosk.
        </p>

        {error ? (
          <p className="mt-3 w-full rounded-lg border border-[#ffcdd2] bg-[#fff5f5] px-3 py-2 text-center text-[12px] font-medium text-[#c62828]">
            {error}
          </p>
        ) : null}

        <div className={styles.emergencySection}>
          <p className={styles.emergencyKicker}>1 · GIỚI TÍNH LÂM SÀNG *</p>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              className={cn(
                styles.clinicalGenderButton,
                clinicalGender === 'male' && styles.clinicalGenderButtonActive,
              )}
              onClick={() => setClinicalGender('male')}
              type="button"
            >
              <span className={cn(styles.clinicalIcon, 'bg-[rgba(21,101,192,0.1)] text-[#1565c0]')}>
                <MaleIcon className="h-7 w-7" />
              </span>
              <span className="text-[17px] font-black uppercase tracking-[0.5px] text-[#1565c0]">
                NAM
              </span>
            </button>
            <button
              className={cn(
                styles.clinicalGenderButton,
                clinicalGender === 'female' && styles.clinicalGenderButtonActive,
              )}
              onClick={() => setClinicalGender('female')}
              type="button"
            >
              <span className={cn(styles.clinicalIcon, 'bg-[rgba(173,20,87,0.1)] text-[#ad1457]')}>
                <FemaleIcon className="h-7 w-7" />
              </span>
              <span className="text-[17px] font-black uppercase tracking-[0.5px] text-[#ad1457]">
                NỮ
              </span>
            </button>
          </div>
        </div>

        <label className={styles.emergencySection}>
          <span className={styles.emergencyKicker}>2 · LÝ DO CẤP CỨU *</span>
          <textarea
            className={styles.textarea}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Mô tả tình trạng cấp cứu (tối thiểu 10 ký tự)..."
            value={reason}
          />
          <span className="mt-1.5 block text-right text-[11px] text-[#707882]">
            {remainingCharacters === 0
              ? `${reason.trim().length} ký tự`
              : `${remainingCharacters} / ${minReasonLength} ký tự tối thiểu`}
          </span>
        </label>

        <button
          className={cn(
            styles.emergencySubmit,
            canSubmit ? styles.emergencySubmitEnabled : styles.emergencySubmitDisabled,
          )}
          disabled={!canSubmit}
          onClick={() => {
            void handleActivate();
          }}
          type="button"
        >
          {isSubmitting ? 'ĐANG XỬ LÝ…' : 'KÍCH HOẠT TIẾP NHẬN CẤP CỨU'}
        </button>

        <p className={styles.emergencyNote}>
          <strong className="text-[#c62828]">Hệ thống sẽ tự động:</strong> Tạo tên tạm
          &quot;Vô danh&quot;, bật cờ bypass, bệnh án isEmergency,{' '}
          <strong>không</strong> lấy số hàng đợi.
        </p>
      </div>
    </section>
  );
}

export function ReceptionWorkspacePage() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<WorkspaceMode>('queue');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'error'>('success');

  // Tránh hydration mismatch khi extension trình duyệt chèn attribute (vd. fdprocessedid) vào <button>.
  // Khóa scroll body chỉ khi ở màn tiếp nhận — không ảnh hưởng trang khác.
  useEffect(() => {
    setMounted(true);
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  const showToast = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastTone(tone);
    window.setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  if (!mounted) {
    return (
      <main className={styles.page} suppressHydrationWarning>
        <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-[#f6fafe] text-sm font-medium text-[#707882]">
          Đang tải màn hình lễ tân...
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Sidebar mode={mode} onChangeMode={setMode} />
      <section className={styles.workspace}>
        <Topbar mode={mode} />
        <div className={styles.workspaceBody}>
          {mode === 'empty' && <EmptyQueueWorkspace onStart={() => setMode('queue')} />}
          {mode === 'queue' && <QueueWorkspace onToast={showToast} />}
          {mode === 'emergency' && <EmergencyWorkspace onToast={showToast} />}
        </div>
      </section>
      <AppToast message={toastMessage} tone={toastTone} />
    </main>
  );
}
