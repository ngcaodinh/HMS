'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { issueTicketRest, reprintQueueTicket } from '../../services/queue.api';
import { kioskRootStyles as styles } from './kiosk-root.styles';

// Múi giờ IANA dùng để hiển thị ngày/giờ pháp lý Việt Nam trên kiosk và phiếu in.
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

/** Định dạng ngày `dd/mm/yyyy` theo múi giờ pháp lý Việt Nam để hiển thị trên kiosk. */
function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
  }).format(date);
}

/** Định dạng giờ `HH:mm:ss` theo múi giờ pháp lý Việt Nam để tránh lệch ngày khi render. */
function formatTime(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
    timeZone: VIETNAM_TIME_ZONE,
  }).format(date);
}

/** Định dạng timestamp phiếu theo `HH:mm · dd/mm/yyyy`, cùng múi giờ với đồng hồ kiosk. */
function formatTicketTimestamp(date: Date) {
  const time = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    timeZone: VIETNAM_TIME_ZONE,
  }).format(date);

  return `${time} · ${formatDate(date)}`;
}

/** Hiển thị số thứ tự với tối thiểu bốn chữ số; không thay đổi số do backend cấp. */
function formatTicketNumber(ticketNumber: number) {
  return String(ticketNumber).padStart(4, '0');
}

/** Tạo khóa ưu tiên UUID cho một lần cấp số; fallback hiện tại có thể bị backend từ chối nếu cần UUID. */
function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `kiosk-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Đồng hồ kiosk, chỉ cập nhật component này mỗi giây để không re-render cả trang.
 *
 * @remarks Trước hydration hiển thị placeholder; sau khi mount đồng bộ timer trình duyệt và
 * dọn interval khi unmount.
 */
function KioskClock() {
  const [now, setNow] = useState(() => new Date());
  const [isMounted, setIsMounted] = useState(false);

  // Chỉ tạo timer sau mount để tránh lệch SSR/hydration; cleanup interval khi rời kiosk.
  useEffect(() => {
    setIsMounted(true);
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <time className={styles.clock} dateTime={isMounted ? now.toISOString() : undefined}>
      <span className={styles.clockTime}>{isMounted ? formatTime(now) : '--:--:--'}</span>
      <span className={styles.clockDate}>{isMounted ? formatDate(now) : ''}</span>
    </time>
  );
}

/**
 * Hiển thị trạng thái mạng trình duyệt cho kiosk mà không mở Socket.IO.
 *
 * @remarks Kiosk hiện cấp số qua REST public; listener `online`/`offline` chỉ phản ánh khả năng
 * kết nối của trình duyệt và được gỡ khi component unmount.
 */
function KioskNetworkBadge() {
  const [isOnline, setIsOnline] = useState(true);

  // Đồng bộ lần đầu và theo dõi external browser events; gỡ cả hai listener khi unmount.
  useEffect(() => {
    const sync = () => {
      const next = window.navigator.onLine;
      setIsOnline((prev) => (prev === next ? prev : next));
    };
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className={`${styles.network} ${isOnline ? styles.networkOnline : styles.networkOffline}`}
      role="status"
    >
      <span
        className={`${styles.networkDot} ${
          isOnline ? styles.networkDotOnline : styles.networkDotOffline
        }`}
      />
      {isOnline ? 'Đã kết nối' : 'Mất kết nối'}
    </div>
  );
}

/**
 * Logo kiosk — dùng <img> tĩnh, không qua next/image optimizer (tránh kẹt load).
 */
function KioskLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt="HMS-VN"
      className={styles.logo}
      decoding="async"
      height={56}
      src="/hms-login-logo.png"
      width={56}
    />
  );
}

/** Chờ React flush số vào DOM print section trước side effect `window.print()`. */
function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.setTimeout(resolve, 50);
      });
    });
  });
}

/**
 * Màn kiosk công khai để cấp số khám ngoại trú và in phiếu không chứa thông tin bệnh nhân.
 *
 * @remarks Không nhận props hoặc callback từ bên ngoài. Trạng thái loading được thể hiện bằng
 * nút disabled khi đang cấp số; lỗi mạng/API hiển thị tại kiosk; thành công mở modal số và tự
 * in, modal vẫn giữ nút in lại hoặc xác nhận đã nhận phiếu sau khi dialog in đóng. Nguồn dữ liệu
 * là các endpoint public cấp số/in lại; không yêu cầu JWT ở backend và không tự quyết định số.
 * Việc cấp số, idempotency và quy tắc gọi FIFO/số nhỏ nhất thuộc backend; kiosk chỉ hiển thị kết
 * quả. `issuingRef` chặn click trùng trong lúc request còn chạy, còn lỗi in lại không chặn in vật lý.
 * UI public không thay thế authorization ở backend.
 */
export function KioskRootPage() {
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [ticketTimestamp, setTicketTimestamp] = useState('');
  const issuingRef = useRef(false);

  const formattedTicketNumber = useMemo(
    () => (ticketNumber === null ? '0001' : formatTicketNumber(ticketNumber)),
    [ticketNumber],
  );

  /**
   * Gọi API in lại best-effort rồi mở dialog in của trình duyệt.
   *
   * @param id Định danh phiếu; `null` khi chỉ cần in snapshot hiện tại.
   * @remarks Endpoint in lại là public và không tạo số mới. Nếu API lỗi, `window.print()` vẫn
   * chạy để không làm mất khả năng in vật lý; dialog đóng sẽ trả người dùng về modal kiosk.
   */
  const printTicket = useCallback(async (id: string | null) => {
    if (id) {
      try {
        await reprintQueueTicket(id);
      } catch {
        // In vật lý vẫn chạy dù API reprint lỗi.
      }
    }
    window.print();
  }, []);

  /**
   * Xử lý click lấy số: kiểm tra online/trùng request, gọi endpoint public và mở luồng in.
   *
   * @remarks Idempotency key do kiosk tạo và backend là nguồn quyết định số waiting; client không
   * tự sắp xếp hoặc chọn số. Success lưu ticket để modal/reprint dùng lại; failure đưa message API
   * hoặc fallback vào `issueError`; `finally` luôn mở khóa nút cấp số.
   */
  const handleGetNumber = useCallback(async () => {
    if (!window.navigator.onLine) {
      setIssueError('Mất kết nối mạng. Vui lòng liên hệ Lễ tân.');
      return;
    }

    if (issuingRef.current) {
      return;
    }

    issuingRef.current = true;
    setIsIssuing(true);
    setIssueError(null);

    try {
      const issued = await issueTicketRest(createIdempotencyKey());
      setTicketId(issued.ticketId);
      setTicketNumber(issued.number);
      setTicketTimestamp(
        formatTicketTimestamp(new Date(issued.receipt.issuedAt || Date.now())),
      );

      // Đợi modal và số đã flush vào print section trước khi mở dialog in tự động.
      await waitForPaint();
      await printTicket(issued.ticketId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không lấy được số. Vui lòng thử lại.';
      setIssueError(message);
    } finally {
      issuingRef.current = false;
      setIsIssuing(false);
    }
  }, [printTicket]);

  /** Xác nhận đã nhận phiếu, đóng modal và xóa toàn bộ state cục bộ của lượt vừa cấp. */
  const handleCloseModal = useCallback(() => {
    setTicketNumber(null);
    setTicketId(null);
    setTicketTimestamp('');
    setIssueError(null);
  }, []);

  /** Xử lý click in lại bằng cùng ticket hiện tại; lỗi API không chặn dialog in vật lý. */
  const handlePrint = useCallback(async () => {
    await printTicket(ticketId);
  }, [printTicket, ticketId]);

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
                <KioskLogo />
              </div>
              <div className="min-w-0">
                <p className={styles.brandName}>HMS-VN</p>
                <p className={styles.brandSubtitle}>
                  Bệnh Viện Da Liễu · Hệ thống quản lý bệnh viện
                </p>
              </div>
            </div>

            <div className={styles.headerRight}>
              <KioskClock />
              <KioskNetworkBadge />
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
                disabled={isIssuing}
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

              {issueError ? (
                <div
                  className={`${styles.offlineMessage} ${styles.offlineMessageVisible}`}
                  role="alert"
                >
                  <WarningIcon className="mt-0.5 h-6 w-6 shrink-0 text-[#ba1a1a]" />
                  <p>{issueError}</p>
                </div>
              ) : null}
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

        {/* Giữ modal sau dialog in để người dùng có thể in lại hoặc xác nhận đã nhận phiếu. */}
        {ticketNumber !== null ? (
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
                  
                  Đã nhận phiếu
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <section aria-hidden="true" className={styles.printTicket}>
        <div className={styles.printTicketInner}>
          <div className="mb-[4mm] flex items-center justify-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
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
            {ticketTimestamp || formatTicketTimestamp(new Date())}
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
