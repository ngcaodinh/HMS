import Image from 'next/image';

import { BriefcaseMedicalIcon, CounterIcon } from '../../components/QueueDisplayIcons';
import type { QueueHistoryItem, QueueStat } from '../../types';
import { darkQueueDisplayStyles as styles } from './dark-queue-display.styles';

const historyItems: QueueHistoryItem[] = [
  { counter: 'Quầy Tiếp Nhận 1', isCurrent: true, number: '1024', time: '02:05' },
  { counter: 'PK B1', number: '1023', time: '02:00' },
  { counter: 'PK A2', number: '1022', time: '01:55' },
  { counter: 'PK A1', number: '1021', time: '01:50' },
  { counter: 'Q 2', number: '1020', time: '01:45' },
  { counter: 'Q 1', number: '1019', time: '01:40' },
  { counter: 'PK B1', number: '1018', time: '01:35' },
  { counter: 'PK A2', number: '1017', time: '01:30' },
];

const stats: QueueStat[] = [
  { label: 'Tổng hôm nay', tone: 'blue', value: '32' },
  { label: 'Đang chờ', tone: 'amber', value: '8' },
  { label: 'Đã hoàn tất', tone: 'green', value: '24' },
];

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

export function DarkQueueDisplayPage() {
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
            <p className={styles.clock}>02:05</p>
            <p className="mt-1 text-right text-xs font-medium text-[#94b8cc]">20/07/2026</p>
          </div>
          <div className={styles.status} role="status">
            <span className="queue-blink-dot h-2 w-2 rounded-full bg-[#00c853]" />
            Trực tuyến
          </div>
        </div>
      </header>

      <section className={styles.main}>
        <section aria-labelledby="current-ticket-title" className={styles.currentSection}>
          <div className={styles.currentGlow} />
          <div className="relative z-10 mx-auto max-w-[440px]">
            <div className={styles.callingBadge} aria-live="assertive" aria-atomic="true">
              <span className="queue-flash-dot h-[9px] w-[9px] rounded-full bg-[#0288d1]" />
              Đang gọi
            </div>

            <p className={styles.currentNumber} aria-label="Số thứ tự đang gọi">
              1024
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
                  Quầy Tiếp Nhận 1
                </p>
              </div>
            </div>

            <p className={styles.helpText}>
              Mang <strong className="font-bold text-[#e8f4fb]">phiếu số</strong> đến quầy được chỉ định.
              <br />
              Vui lòng chuẩn bị{' '}
              <strong className="font-bold text-[#e8f4fb]">CCCD / sổ bảo hiểm</strong>.
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
            <span className={styles.countBadge}>8 số</span>
          </div>

          <dl className={styles.statsBar}>
            {stats.map((stat) => (
              <div className={styles.statItem} key={stat.label}>
                <dt className={`text-[22px] font-extrabold leading-none ${statToneClass[stat.tone ?? 'blue']}`}>
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
            {historyItems.map((item, index) => (
              <div
                className={`${styles.row} ${
                  index % 2 === 0 ? 'border-[#29b6f6]/10 bg-[#0f2236]' : 'border-[#29b6f6]/10 bg-[#0d1e30]'
                } ${item.isCurrent ? 'border-[#0288d1]/50 bg-[#0086c2]/15' : ''}`}
                key={item.number}
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
            ))}
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
                <span className="relative top-[1px] shrink-0 text-[9px] leading-none text-white/60">◆</span>
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
