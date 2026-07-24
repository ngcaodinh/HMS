'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '@/shared/api-client/api-client';
import {
  callNextQueueTicket,
  issueDeskTicket,
  listQueueTickets,
  recallQueueTicket,
  skipQueueTicket,
} from '@/modules/queue/services/queue.api';
import type { QueueTicketDto } from '@/modules/queue/types';

import { receptionWorkspaceStyles as styles } from './reception-workspace.styles';

type WorkspaceMode = 'empty' | 'queue' | 'emergency';
type Gender = 'male' | 'female';
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
    <aside className={cn(styles.sidebar, isEmergency && styles.sidebarEmergency)}>
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
      >
        <button
          className={cn(
            styles.navItem,
            mode !== 'emergency' ? styles.navItemActive : styles.navItemQueueInactive,
          )}
          onClick={() => onChangeMode(mode === 'empty' ? 'queue' : 'empty')}
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
        <button aria-label="Đăng xuất" className={styles.logoutButton} type="button">
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

function QueueTicketPanel() {
  const legalDate = useMemo(() => getLegalDateString(), []);
  const [tab, setTab] = useState<QueueTab>('waiting');
  const [waiting, setWaiting] = useState<QueueTicketDto[]>([]);
  const [skipped, setSkipped] = useState<QueueTicketDto[]>([]);
  const [called, setCalled] = useState<QueueTicketDto | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deskMessage, setDeskMessage] = useState<string | null>(null);

  const refreshLists = useCallback(async () => {
    const [waitingResult, skippedResult, calledResult] = await Promise.all([
      listQueueTickets({ date: legalDate, status: 'waiting', pageSize: 50 }),
      listQueueTickets({ date: legalDate, status: 'skipped', pageSize: 50 }),
      listQueueTickets({ date: legalDate, status: 'called', pageSize: 10 }),
    ]);

    setWaiting(waitingResult.items);
    setSkipped(skippedResult.items);
    setCalled(calledResult.items[0] ?? null);
  }, [legalDate]);

  useEffect(() => {
    void refreshLists().catch((error: unknown) => {
      setActionError(getApiErrorMessage(error, 'Không tải được hàng đợi'));
    });

    const poll = window.setInterval(() => {
      void refreshLists().catch(() => undefined);
    }, 10000);

    return () => window.clearInterval(poll);
  }, [refreshLists]);

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
      setCalled(ticket);
    });

  const handleSkip = () =>
    runAction(async () => {
      if (!called) {
        throw new Error('Chưa có số đang gọi để bỏ qua');
      }
      await skipQueueTicket(called.ticketId, 'Bệnh nhân không có mặt');
    });

  const handleRecall = () =>
    runAction(async () => {
      const target = skipped[0] ?? (called?.status === 'skipped' ? called : null);
      if (!target && skipped.length === 0) {
        throw new Error('Không có số bỏ qua để gọi lại');
      }
      const ticketId = (skipped[0] ?? target)?.ticketId;
      if (!ticketId) {
        throw new Error('Không có số bỏ qua để gọi lại');
      }
      const ticket = await recallQueueTicket(ticketId, 'Bệnh nhân đã quay lại quầy');
      setCalled(ticket);
      setTab('waiting');
    });

  const handleDeskIssue = () =>
    runAction(async () => {
      const issued = await issueDeskTicket(createIdempotencyKey());
      setDeskMessage(`Đã bốc số ${formatTicketNumber(issued.number)} tại quầy`);
    });

  const list = tab === 'waiting' ? waiting : skipped;

  return (
    <aside className={styles.queuePanel}>
      <section className={styles.nowServing}>
        <p className={styles.sectionKicker}>SỐ ĐANG PHỤC VỤ</p>
        <p className={styles.servingNumber}>
          {called ? formatTicketNumber(called.number) : '----'}
        </p>
        <p className={styles.servingDesk}>Quầy Tiếp Nhận</p>
        <span className={styles.statusPill}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#006096]" />
          {called ? 'Đang gọi' : 'Chờ gọi số'}
        </span>
      </section>

      <section className={styles.queueActions}>
        <button
          className={cn(styles.primaryButton, 'mb-2 w-full rounded-[10px] py-3 uppercase')}
          disabled={isBusy}
          onClick={() => {
            void handleCallNext();
          }}
          type="button"
        >
          GỌI SỐ TIẾP THEO
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={styles.secondaryButton}
            disabled={isBusy || skipped.length === 0}
            onClick={() => {
              void handleRecall();
            }}
            type="button"
          >
            Gọi lại
          </button>
          <button
            className={styles.dangerOutlineButton}
            disabled={isBusy || !called}
            onClick={() => {
              void handleSkip();
            }}
            type="button"
          >
            Bỏ qua
          </button>
        </div>
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
                  disabled={isBusy}
                  onClick={() => {
                    void runAction(async () => {
                      const recalled = await recallQueueTicket(
                        ticket.ticketId,
                        'Gọi lại thủ công từ danh sách bỏ qua',
                      );
                      setCalled(recalled);
                    });
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

function Field({ label, placeholder, required = false, type = 'text', value }: FieldProps) {
  return (
    <label className="block">
      <span className={styles.fieldLabel}>
        {label} {required && <span className={styles.required}>*</span>}
      </span>
      <input
        className={styles.input}
        placeholder={placeholder}
        type={type}
        value={value}
        readOnly
      />
    </label>
  );
}

function PatientReceptionForm() {
  const [patientGender, setPatientGender] = useState<Gender>('male');

  return (
    <section className={styles.formArea}>
      <div className={styles.formScroll}>
        <div className={styles.infoStrip}>
          <div>
            <p className="text-[11px] font-medium leading-normal text-[#3f4851]">
              Đang làm thủ tục cho
            </p>
            <p className="text-[18px] font-black leading-normal text-[#006096]">
              Tiếp nhận · Quầy
            </p>
          </div>
          <span className={styles.statusPill}>Đang gọi</span>
        </div>

        <div className={styles.formCard}>
          <div className="mb-3 flex gap-2">
            <input
              aria-label="Tìm kiếm bệnh nhân cũ"
              className={styles.input}
              placeholder="Họ tên · Số điện thoại · CCCD..."
            />
            <button
              className={cn(styles.primaryButton, 'shrink-0 rounded-[10px] px-5')}
              type="button"
            >
              Tìm kiếm
            </button>
          </div>
          <p className="rounded-lg bg-[#ffeccc] px-3 py-2 text-[11px] font-medium leading-[18px] text-[#895500]">
            Lưu ý: Kết quả chỉ hiển thị thông tin hành chính được che ký tự nhạy cảm.
          </p>
        </div>

        <div className={styles.formCard}>
          <p className={styles.formLegend}>THÔNG TIN HÀNH CHÍNH</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Họ và tên" required value="NGUYỄN VĂN A" />
            </div>
            <Field label="Ngày sinh" placeholder="mm/dd/yyyy" required />
            <div>
              <p className={styles.fieldLabel}>
                Giới tính <span className={styles.required}>*</span>
              </p>
              <div className="flex gap-2">
                <button
                  className={cn(
                    styles.genderButton,
                    patientGender === 'male' && styles.genderButtonActive,
                  )}
                  onClick={() => setPatientGender('male')}
                  type="button"
                >
                  Nam
                </button>
                <button
                  className={cn(
                    styles.genderButton,
                    patientGender === 'female' && styles.genderButtonActive,
                  )}
                  onClick={() => setPatientGender('female')}
                  type="button"
                >
                  Nữ
                </button>
              </div>
            </div>
            <Field label="Số CCCD" placeholder="12 chữ số" required />
            <Field label="Số điện thoại" placeholder="09x xxxx xxxx" />
          </div>
        </div>

        <div className={styles.formCard}>
          <p className={styles.formLegend}>BẢO HIỂM Y TẾ (BHYT)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mã số thẻ BHYT" placeholder="XX XXXXXXXXX XXXX" />
            <Field label="Ngày hết hạn thẻ" placeholder="mm/dd/yyyy" />
          </div>
        </div>

        <div className={styles.formCard}>
          <p className={styles.formLegend}>KHÁM & BÁC SĨ</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className={styles.fieldLabel}>
                Bác sĩ khám <span className={styles.required}>*</span>
              </span>
              <select className={styles.input} defaultValue="">
                <option value="">— Chọn bác sĩ —</option>
                <option value="doctor-1">BS. Trần Minh Anh</option>
                <option value="doctor-2">BS. Lê Hoàng Nam</option>
              </select>
            </label>
            <Field label="Lý do khám" />
          </div>
        </div>

        <div className={styles.formCard}>
          <label className={styles.consent}>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-[#bfc7d2] bg-white text-[#006096]">
              <CheckIcon className="h-3 w-3" />
            </span>
            <input className="sr-only" defaultChecked type="checkbox" />
            <span>Xác nhận bệnh nhân đã đồng ý với thông báo bảo vệ dữ liệu cá nhân.</span>
          </label>
        </div>
      </div>

      <footer className={styles.formFooter}>
        <button className={cn(styles.mutedButton, 'px-5 py-3.5 text-[13px]')} type="button">
          Hủy / Làm mới
        </button>
        <button
          className={cn(styles.primaryButton, 'rounded-[10px] px-7 py-3 uppercase')}
          type="button"
        >
          HOÀN TẤT TIẾP NHẬN
        </button>
      </footer>
    </section>
  );
}

function QueueWorkspace() {
  return (
    <section className={styles.queueLayout}>
      <QueueTicketPanel />
      <PatientReceptionForm />
    </section>
  );
}

function EmergencyWorkspace() {
  const [clinicalGender, setClinicalGender] = useState<Gender | null>(null);
  const [reason, setReason] = useState('');
  const minReasonLength = 10;
  const canSubmit = clinicalGender !== null && reason.trim().length >= minReasonLength;
  const remainingCharacters = useMemo(
    () => Math.max(minReasonLength - reason.trim().length, 0),
    [reason],
  );

  return (
    <section className={styles.emergencyBody}>
      <div className={styles.emergencyGlow} />
      <div className={styles.emergencyCard}>
        <div className={styles.emergencyIcon}>
          <EmergencyIcon className="h-8 w-8" />
        </div>
        <h2 className={styles.emergencyTitle}>Tiếp nhận Cấp cứu</h2>
        <p className={styles.emergencyDescription}>
          Bypass định danh — dành cho trường hợp nguy kịch khẩn cấp.
        </p>

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
            placeholder="Mô tả tình trạng cấp cứu..."
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
          type="button"
        >
          KÍCH HOẠT TIẾP NHẬN CẤP CỨU
        </button>

        <p className={styles.emergencyNote}>
          <strong className="text-[#c62828]">Hệ thống sẽ tự động:</strong> Tạo tên tạm “Vô danh” ·
          Bật cờ bypass · In vòng đeo tay định danh lâm sàng.
        </p>
      </div>
    </section>
  );
}

export function ReceptionWorkspacePage() {
  const [mode, setMode] = useState<WorkspaceMode>('queue');

  return (
    <main className={styles.page}>
      <Sidebar mode={mode} onChangeMode={setMode} />
      <section className={styles.workspace}>
        <Topbar mode={mode} />
        <div className={styles.workspaceBody}>
          {mode === 'empty' && <EmptyQueueWorkspace onStart={() => setMode('queue')} />}
          {mode === 'queue' && <QueueWorkspace />}
          {mode === 'emergency' && <EmergencyWorkspace />}
        </div>
      </section>
    </main>
  );
}
