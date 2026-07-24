'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { BriefcaseMedicalIcon, CounterIcon } from '../../components/QueueDisplayIcons';
import { fetchPublicQueueDisplay } from '../../services/queue.api';
import {
  getQueueSocket,
  joinQueueRoom,
  subscribeQueueEvents,
} from '../../services/queue.socket';
import type { QueueHistoryItem, QueueStat } from '../../types';
import { darkQueueDisplayStyles as styles } from './dark-queue-display.styles';

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const tickerItems = [
  {
    text: 'Vui lòng chuẩn bị CCCD / sổ bảo hiểm trước khi đến quầy tiếp nhận',
  },
  {
    highlight: 'Bệnh Viện Da Liễu HMS-VN',
    text: 'Chào mừng quý bệnh nhân đến với ',
  },
  {
    text: 'Vui lòng giữ trật tự và ngồi chờ tại ghế, chúng tôi sẽ gọi số của bạn',
  },
  {
    text: 'Vui lòng chuẩn bị CCCD / sổ bảo hiểm trước khi đến quầy tiếp nhận',
  },
];

const statToneClass: Record<NonNullable<QueueStat['tone']>, string> = {
  amber: 'text-[#ffb300]',
  blue: 'text-[#29b6f6]',
  green: 'text-[#69f0ae]',
};

function formatTicketNumber(ticketNumber: number) {
  return String(ticketNumber).padStart(4, '0');
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    timeZone: VIETNAM_TIME_ZONE,
  }).format(date);
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: VIETNAM_TIME_ZONE,
  }).format(date);
}

function formatCalledAt(iso: string | null | undefined) {
  if (!iso) {
    return '--:--';
  }
  return formatClock(new Date(iso));
}

/**
 * Màn LED public — REST snapshot + Socket realtime, không PII.
 */
export function DarkQueueDisplayPage() {
  const [now, setNow] = useState(() => new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [currentCalledAt, setCurrentCalledAt] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<QueueHistoryItem[]>([]);
  const [stats, setStats] = useState<QueueStat[]>([
    { label: 'Tổng hôm nay', tone: 'blue', value: '0' },
    { label: 'Đang gọi', tone: 'amber', value: '0' },
    { label: 'Đã hoàn tất', tone: 'green', value: '0' },
  ]);

  const loadBoard = useCallback(async () => {
    try {
      const board = await fetchPublicQueueDisplay();
      const current = board.currentlyCalled[0] ?? null;
      setCurrentNumber(current?.number ?? null);
      setCurrentCalledAt(current?.calledAt ?? null);

      const history: QueueHistoryItem[] = board.currentlyCalled.map((item, index) => ({
        counter: 'Quầy Tiếp Nhận',
        isCurrent: index === 0,
        number: formatTicketNumber(item.number),
        time: formatCalledAt(item.calledAt),
      }));

      board.recentlyServedNumbers.forEach((number) => {
        history.push({
          counter: 'Đã tiếp nhận',
          number: formatTicketNumber(number),
          time: '--:--',
        });
      });

      setHistoryItems(history.slice(0, 8));
      setStats([
        {
          label: 'Đang gọi',
          tone: 'blue',
          value: String(board.currentlyCalled.length),
        },
        {
          label: 'Lịch sử',
          tone: 'amber',
          value: String(history.length),
        },
        {
          label: 'Đã hoàn tất',
          tone: 'green',
          value: String(board.recentlyServedNumbers.length),
        },
      ]);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const socket = getQueueSocket();
    joinQueueRoom();
    void loadBoard();

    const unsubscribe = subscribeQueueEvents({
      onCalled: () => {
        void loadBoard();
      },
      onUpdated: () => {
        void loadBoard();
      },
    });

    const handleConnect = () => {
      setIsOnline(true);
      joinQueueRoom();
      void loadBoard();
    };
    const handleDisconnect = () => setIsOnline(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    if (!socket.connected) {
      socket.connect();
    }

    const poll = window.setInterval(() => {
      void loadBoard();
    }, 15000);

    return () => {
      unsubscribe();
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      window.clearInterval(poll);
    };
  }, [loadBoard]);

  const displayNumber = useMemo(
    () => (currentNumber === null ? '----' : formatTicketNumber(currentNumber)),
    [currentNumber],
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Image
              alt="Logo HMS-VN"
              className="h-full w-full object-cover"
              height={48}
              priority
              src="/hms-login-logo.png"
              width={48}
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-[22px] font-extrabold leading-none tracking-[-0.03em] text-[#e8f4fb]">
              HMS-VN
            </h1>
            <p className="mt-1 truncate text-[11.5px] font-medium tracking-[0.04em] text-[#94b8cc]">
              Bệnh Viện Da Liễu · Hàng Đợi Tự Động
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className={styles.eyebrow}>Bảng Hiển Thị</p>
          <h2 className={styles.headerTitle}>Phòng Khám Ngoại Trú - Tầng 1</h2>
        </div>

        <div className={styles.headerRight}>
          <div>
            <p className={styles.clock}>{formatClock(now)}</p>
            <p className="mt-1 text-right text-xs font-medium text-[#94b8cc]">
              {formatLongDate(now)}
            </p>
          </div>
          <div className={styles.status} role="status">
            <span
              className={`queue-blink-dot h-2 w-2 rounded-full ${
                isOnline ? 'bg-[#00c853]' : 'bg-[#ff5252]'
              }`}
            />
            {isOnline ? 'Trực tuyến' : 'Mất kết nối'}
          </div>
        </div>
      </header>

      <section className={styles.main}>
        <section aria-labelledby="current-ticket-title" className={styles.currentSection}>
          <div className={styles.currentGlow} />
          <div className="relative z-10 mx-auto max-w-[440px]">
            <div className={styles.callingBadge} aria-live="assertive" aria-atomic="true">
              <span className="queue-flash-dot h-[9px] w-[9px] rounded-full bg-[#0288d1]" />
              {currentNumber === null ? 'Chờ gọi số' : 'Đang gọi'}
            </div>

            <p className={styles.currentNumber} aria-label="Số thứ tự đang gọi">
              {displayNumber}
            </p>
            <h2 className={styles.department} id="current-ticket-title">
              Khám bệnh ngoại trú
            </h2>

            <div className={styles.destination} aria-label="Vị trí khám">
              <span className={styles.destinationIcon}>
                <BriefcaseMedicalIcon className="h-[26px] w-[26px]" />
              </span>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[1.5px] text-white/70">
                  Vui lòng đến
                </p>
                <p className="text-[22px] font-extrabold leading-none tracking-normal text-white">
                  Quầy Tiếp Nhận
                </p>
              </div>
            </div>

            <p className={styles.helpText}>
              Mang <strong className="font-bold text-[#e8f4fb]">phiếu số</strong> đến quầy được chỉ
              định.
              <br />
              Vui lòng chuẩn bị{' '}
              <strong className="font-bold text-[#e8f4fb]">CCCD / sổ bảo hiểm</strong>.
              {currentCalledAt ? (
                <>
                  <br />
                  Gọi lúc {formatCalledAt(currentCalledAt)}
                </>
              ) : null}
            </p>
          </div>
        </section>

        <aside aria-label="Các số đã gọi gần đây" className={styles.historySection}>
          <div className={styles.historyHeader}>
            <span className={styles.historyIcon}>
              <CounterIcon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold tracking-[0.03em] text-[#e8f4fb]">
                Các số đã gọi gần đây
              </h2>
              <p className="mt-0.5 text-[11px] font-medium tracking-[0.02em] text-[#4f7a92]">
                Đối chiếu nếu bạn nhỡ lượt
              </p>
            </div>
            <span className={styles.countBadge}>{historyItems.length} số</span>
          </div>

          <dl className={styles.statsBar}>
            {stats.map((stat) => (
              <div className={styles.statItem} key={stat.label}>
                <dt
                  className={`text-[22px] font-extrabold leading-none ${statToneClass[stat.tone ?? 'blue']}`}
                >
                  {stat.value}
                </dt>
                <dd className="mt-1 text-center text-[10px] font-semibold uppercase tracking-[1.5px] text-[#4f7a92]">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>

          <div className={styles.tableHeader} role="row" aria-label="Tiêu đề bảng">
            <span role="columnheader">Số TT</span>
            <span className="text-center" role="columnheader">
              Quầy / Phòng
            </span>
            <span className="text-right" role="columnheader">
              Giờ gọi
            </span>
          </div>

          <div className={styles.historyRows} role="table" aria-label="Danh sách số đã gọi">
            {historyItems.length === 0 ? (
              <div className={`${styles.row} border-[#29b6f6]/10 bg-[#0f2236]`} role="row">
                <p className="col-span-3 text-center text-sm text-[#4f7a92]" role="cell">
                  Chưa có số được gọi hôm nay
                </p>
              </div>
            ) : (
              historyItems.map((item, index) => (
                <div
                  className={`${styles.row} ${
                    index % 2 === 0
                      ? 'border-[#29b6f6]/10 bg-[#0f2236]'
                      : 'border-[#29b6f6]/10 bg-[#0d1e30]'
                  } ${item.isCurrent ? 'border-[#0288d1]/50 bg-[#0086c2]/15' : ''}`}
                  key={`${item.number}-${index}`}
                  role="row"
                >
                  <p
                    className={`text-[28px] font-black leading-none tracking-[-0.02em] ${
                      item.isCurrent ? 'text-[#29b6f6]' : 'text-[#e8f4fb]'
                    }`}
                    role="cell"
                  >
                    {item.number}
                  </p>
                  <p className="text-center" role="cell">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] ${
                        item.isCurrent
                          ? 'border-[#ffb300]/30 bg-[#ffb300]/15 text-[#ffb300]'
                          : 'border-[#00c853]/30 bg-[#00c853]/15 text-[#69f0ae]'
                      }`}
                    >
                      {item.isCurrent ? '● ' : ''}
                      {item.counter}
                    </span>
                  </p>
                  <p
                    className="text-right text-[13px] font-medium tracking-[0.02em] text-[#4f7a92]"
                    role="cell"
                  >
                    {item.time}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>

      <footer className={styles.footer} aria-label="Thông báo bệnh viện">
        <div className={styles.tickerLabel}>
          <span className="queue-blink-dot h-2 w-2 rounded-full bg-white" />
          Thông báo
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className={styles.tickerTrack}>
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <span
                className="inline-flex h-[26px] translate-y-1 items-center gap-3 whitespace-nowrap px-9 text-[17px] font-semibold leading-[26px] text-white"
                key={`${item.text}-${index}`}
              >
                <span className="relative top-[1px] shrink-0 text-[9px] leading-none text-white/60">
                  ◆
                </span>
                <span>
                  {item.text}
                  {item.highlight ? (
                    <strong className="font-extrabold text-[#ffe082]">{item.highlight}</strong>
                  ) : null}
                </span>
              </span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
