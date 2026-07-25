'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { reprintQueueTicket } from '../../services/queue.api';
import {
  getQueueSocket,
  isQueueSocketConnected,
  issueTicketViaSocket,
} from '../../services/queue.socket';
import { kioskRootStyles as styles } from './kiosk-root.styles';

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

type IconProps = {
  className?: string;
};

function InfoIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 8v5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <circle cx="9" cy="5.5" fill="currentColor" r="1" />
    </svg>
  );
}

function MedicalClipboardIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 160 160">
      <circle cx="80" cy="80" fill="#e8f4fd" r="74" />
      <circle cx="80" cy="80" fill="#d0e9f8" r="60" />
      <rect
        fill="white"
        height="70"
        rx="8"
        stroke="#bcd7ea"
        strokeWidth="2"
        width="56"
        x="52"
        y="45"
      />
      <rect fill="#006096" height="12" rx="5" width="24" x="68" y="40" />
      <rect fill="#006096" height="28" opacity="0.85" rx="4" width="16" x="72" y="65" />
      <rect fill="#006096" height="14" opacity="0.85" rx="4" width="30" x="65" y="72" />
      <rect fill="#bcd7ea" height="4" rx="2" width="40" x="60" y="103" />
      <rect fill="#bcd7ea" height="3" rx="1.5" width="28" x="60" y="111" />
      <circle cx="128" cy="42" fill="#cee5ff" r="10" stroke="#96c8ef" strokeWidth="1.5" />
      <path
        d="M128 37v10M123 42h10"
        stroke="#006096"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx="34" cy="118" fill="#cbe7f5" r="8" stroke="#96c8ef" strokeWidth="1.5" />
      <circle cx="34" cy="118" fill="#006096" r="3" />
    </svg>
  );
}

function TicketPlusIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 44 44">
      <rect fill="white" height="32" opacity="0.2" rx="6" width="28" x="8" y="6" />
      <rect fill="white" height="26" opacity="0.18" rx="4" width="22" x="11" y="9" />
      <path d="M22 14v16M14 22h16" stroke="white" strokeLinecap="round" strokeWidth="4" />
    </svg>
  );
}

function PrinterIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 40 40">
      <path
        d="M11 16V8h18v8M10 27H8a4 4 0 0 1-4-4v-5a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4h-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
      />
      <rect
        height="10"
        rx="2"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2.6"
        width="18"
        x="11"
        y="22"
      />
      <path d="M15 26h10M15 30h7" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
    </svg>
  );
}

function SmallPrinterIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M7 8V4h10v4M7 17H5a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <rect height="6" rx="1.5" stroke="currentColor" strokeWidth="1.8" width="10" x="7" y="14" />
    </svg>
  );
}

function ClockIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M10 6.5v4l2.75 1.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M5 12.5 9.25 17 19 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function WarningIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M11 7v5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <circle cx="11" cy="15.5" fill="currentColor" r="1" />
    </svg>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
    timeZone: VIETNAM_TIME_ZONE,
  }).format(date);
}

function formatTicketTimestamp(date: Date) {
  const time = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    timeZone: VIETNAM_TIME_ZONE,
  }).format(date);

  return `${time} · ${formatDate(date)}`;
}

function formatTicketNumber(ticketNumber: number) {
  return String(ticketNumber).padStart(4, '0');
}

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `kiosk-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function KioskRootPage() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [isMounted, setIsMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [ticketTimestamp, setTicketTimestamp] = useState('');

  const formattedTicketNumber = useMemo(
    () => (ticketNumber === null ? '0001' : formatTicketNumber(ticketNumber)),
    [ticketNumber],
  );

  const refreshConnectionState = useCallback(() => {
    const browserOnline = window.navigator.onLine;
    const socketOnline = isQueueSocketConnected();
    setIsOnline(browserOnline && socketOnline);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const socket = getQueueSocket();
    refreshConnectionState();

    const timer = window.setInterval(() => {
      setNow(new Date());
      refreshConnectionState();
    }, 1000);

    const handleOnline = () => refreshConnectionState();
    const handleOffline = () => setIsOnline(false);
    const handleConnect = () => refreshConnectionState();
    const handleDisconnect = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [refreshConnectionState]);

  const handleGetNumber = async () => {
    if (!window.navigator.onLine) {
      setIsOnline(false);
      setIssueError('Mất kết nối mạng. Vui lòng liên hệ Lễ tân.');
      return;
    }

    if (isIssuing) {
      return;
    }

    setIsIssuing(true);
    setIssueError(null);

    try {
      const issued = await issueTicketViaSocket(createIdempotencyKey());
      setTicketId(issued.ticketId);
      setTicketNumber(issued.number);
      setTicketTimestamp(
        formatTicketTimestamp(new Date(issued.receipt.issuedAt || Date.now())),
      );
      setIsOnline(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không lấy được số. Vui lòng thử lại.';
      setIssueError(message);
      refreshConnectionState();
    } finally {
      setIsIssuing(false);
    }
  };

  const handleCloseModal = () => {
    setTicketNumber(null);
    setTicketId(null);
    setTicketTimestamp('');
  };

  const handlePrint = async () => {
    if (ticketId) {
      try {
        await reprintQueueTicket(ticketId);
      } catch {
        // In vật lý vẫn chạy; API chỉ xác nhận in lại không tạo số mới.
      }
    }
    window.print();
  };

  return (
    <>
      <main className={styles.page}>
        <div aria-hidden="true" className={styles.background}>
          <span className={styles.backgroundCircleLarge} />
          <span className={styles.backgroundCircleTop} />
          <span className={styles.backgroundCircleBottom} />
        </div>

        <div className={styles.shell}>
          <header className={styles.header}>
            <div className={styles.brand}>
              <div className={styles.logoWrap}>
                <Image
                  alt="Bệnh viện Da Liễu Trung ương"
                  className={styles.logo}
                  height={56}
                  priority
                  src="/hms-login-logo.png"
                  width={56}
                />
              </div>
              <div className="min-w-0">
                <p className={styles.brandName}>HMS-VN</p>
                <p className={styles.brandSubtitle}>
                  Bệnh Viện Da Liễu · Hệ thống quản lý bệnh viện
                </p>
              </div>
            </div>

            <div className={styles.headerRight}>
              <time className={styles.clock} dateTime={isMounted ? now.toISOString() : undefined}>
                <span className={styles.clockTime}>{isMounted ? formatTime(now) : '--:--:--'}</span>
                <span className={styles.clockDate}>{isMounted ? formatDate(now) : ''}</span>
              </time>
              <div
                aria-live="polite"
                className={`${styles.network} ${
                  isOnline ? styles.networkOnline : styles.networkOffline
                }`}
                role="status"
              >
                <span
                  className={`${styles.networkDot} ${
                    isOnline ? styles.networkDotOnline : styles.networkDotOffline
                  }`}
                />
                {isOnline ? 'Đã kết nối' : 'Mất kết nối'}
              </div>
            </div>
          </header>

          <section className={styles.main}>
            <div className={styles.hero}>
              <MedicalClipboardIcon className={styles.heroIcon} />
              <div>
                <h1 className={styles.heading}>
                  Chào mừng đến
                  <span className={styles.headingAccent}>Bệnh Viện Da Liễu HMS-VN</span>
                </h1>
                <p className={styles.subheading}>
                  Vui lòng lấy số để đăng ký thứ tự khám bệnh
                </p>
              </div>
            </div>

            <div className={styles.ctaWrap}>
              <button
                aria-label="Lấy số khám bệnh"
                className={styles.ctaButton}
                disabled={!isOnline || isIssuing}
                onClick={() => {
                  void handleGetNumber();
                }}
                type="button"
              >
                <span className={styles.ctaRingInner} />
                <span className={styles.ctaRingOuter} />
                <span className={styles.ctaContent}>
                  <TicketPlusIcon className={styles.ctaIcon} />
                  <span className={styles.ctaText}>
                    {isIssuing ? 'ĐANG CẤP SỐ…' : 'LẤY SỐ KHÁM BỆNH'}
                  </span>
                </span>
              </button>

              <div
                className={`${styles.offlineMessage} ${
                  isOnline && !issueError ? '' : styles.offlineMessageVisible
                }`}
                role="alert"
              >
                <WarningIcon className="mt-0.5 h-6 w-6 shrink-0 text-[#ba1a1a]" />
                <p>
                  {issueError ?? (
                    <>
                      Hệ thống mất kết nối tạm thời. Vui lòng liên hệ{' '}
                      <strong>Lễ tân tại quầy</strong> để được hỗ trợ.
                    </>
                  )}
                </p>
              </div>
            </div>
          </section>

          <footer className={styles.footer}>
            <p className={styles.footerGuide}>
              <InfoIcon className="h-[18px] w-[18px] text-[#006096]" />
              <span>Vui lòng nhấn nút ở trên để nhận</span>
              <strong className={styles.footerStrong}>phiếu thứ tự khám bệnh</strong>
            </p>
            <p className={styles.footerCopy}>
              HMS-VN · Kiosk Lấy Số Tự Động · Phòng Khám Da Liễu
            </p>
          </footer>
        </div>

        {ticketNumber !== null && (
          <div
            aria-labelledby="ticket-modal-title"
            aria-modal="true"
            className={styles.overlay}
            role="dialog"
          >
            <div className={styles.modal}>
              <div className={styles.modalIconWrap}>
                <PrinterIcon className={styles.modalIcon} />
              </div>

              <h2 className={styles.modalLabel} id="ticket-modal-title">
                SỐ THỨ TỰ CỦA BẠN
              </h2>
              <p aria-live="polite" className={styles.modalNumber}>
                {formattedTicketNumber}
              </p>
              <p className={styles.modalType}>Khám bệnh ngoại trú</p>

              <p className={styles.timestamp}>
                <ClockIcon className="h-5 w-5 text-[#006096]" />
                {ticketTimestamp}
              </p>

              <div className={styles.modalActions}>
                <button
                  className={styles.secondaryButton}
                  onClick={() => {
                    void handlePrint();
                  }}
                  type="button"
                >
                  <SmallPrinterIcon className="h-6 w-6" />
                  In lại phiếu
                </button>
                <button className={styles.primaryButton} onClick={handleCloseModal} type="button">
                  <CheckIcon className="h-6 w-6" />
                  Đã nhận phiếu · Quay lại
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <section aria-hidden="true" className={styles.printTicket}>
        <div className={styles.printTicketInner}>
          <div className="mb-[4mm] flex items-center justify-center gap-2">
            <Image
              alt=""
              className="rounded-full"
              height={26}
              src="/hms-login-logo.png"
              width={26}
            />
            <span className="text-sm font-extrabold text-[#006096]">HMS-VN</span>
          </div>
          <p className="mb-[3mm] text-center text-[11px] font-semibold uppercase tracking-[0.15em]">
            PHÒNG KHÁM DA LIỄU
          </p>
          <hr className="my-[3mm] border-t border-dashed border-[#c0c0c0]" />
          <p className="mb-[3mm] text-center text-[11px] font-semibold uppercase tracking-[0.15em]">
            PHIẾU KHÁM BỆNH NGOẠI TRÚ
          </p>
          <p className="mb-[3mm] text-center text-5xl font-black leading-none text-[#006096]">
            {formattedTicketNumber}
          </p>
          <p className="mb-[4mm] text-center text-[13px] font-semibold">
            {ticketTimestamp || formatTicketTimestamp(now)}
          </p>
          <hr className="my-[3mm] border-t border-dashed border-[#c0c0c0]" />
          <p className="border-t border-[#e0e0e0] pt-[3mm] text-center text-[11px] leading-5 text-[#555]">
            Vui lòng chú ý bảng hiển thị và đợi gọi số tại sảnh đón tiếp.
            <br />
            Giữ phiếu này đến khi hoàn tất khám.
          </p>
          <p className="mt-[3mm] text-center text-[10px] text-[#aaa]">
            HMS-VN · Hệ thống quản lý bệnh viện
          </p>
        </div>
      </section>
    </>
  );
}
