import type { ReactNode } from 'react';
import Image from 'next/image';

import type { WorklistItem } from '../types/medical-record.types';
import { AssetIcon, calculateAge, cn, genderLabel } from './shared';
import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

const assetPath = '/doctor-assets';

function statusMeta(status: WorklistItem['status'], isSelected: boolean) {
  if (isSelected) {
    return { label: 'Đang khám', numberClass: 'bg-[rgba(96,165,250,0.2)] text-[#93c5fd]', pillClass: 'border-[rgba(96,165,250,0.4)] bg-[rgba(96,165,250,0.2)] text-[#96ccff]' };
  }
  if (status === 'waiting_results') {
    return { label: 'Chờ KQ', numberClass: 'bg-[rgba(34,211,238,0.1)] text-[#67e8f9]', pillClass: 'border-[rgba(34,211,238,0.3)] bg-[rgba(34,211,238,0.1)] text-[#55d7ed]' };
  }
  if (status === 'diagnosed') {
    return { label: 'Đã chẩn đoán', numberClass: 'bg-[rgba(251,191,36,0.12)] text-[#fcd34d]', pillClass: 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.2)] text-[#fbbf24]' };
  }
  return { label: 'Chờ khám', numberClass: 'bg-[rgba(251,191,36,0.2)] text-[#fcd34d]', pillClass: 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.2)] text-[#fbbf24]' };
}

export function Sidebar({
  doctorName,
  onSelectPatient,
  searchTerm,
  onSearchTermChange,
  selectedRecordId,
  worklist,
}: {
  doctorName: string;
  onSelectPatient: (recordId: string) => void;
  onSearchTermChange: (value: string) => void;
  searchTerm: string;
  selectedRecordId: string | null;
  worklist: WorklistItem[];
}) {
  const filtered = worklist.filter((item) =>
    item.patient.fullName.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );
  const active = filtered.filter((item) => item.recordId === selectedRecordId);
  const waiting = filtered.filter((item) => item.status === 'open' && item.recordId !== selectedRecordId);
  const waitingResults = filtered.filter(
    (item) => item.status === 'waiting_results' && item.recordId !== selectedRecordId,
  );
  const diagnosed = filtered.filter(
    (item) => item.status === 'diagnosed' && item.recordId !== selectedRecordId,
  );

  const doneCount = worklist.filter((item) => item.status === 'closed').length;
  const waitingCount = worklist.filter((item) => item.status === 'open' || item.status === 'waiting_results').length;
  const stats: Array<[string, string, string]> = [
    [String(doneCount), 'Đã khám', 'text-[#6ee7b7]'],
    [String(waitingCount), 'Đang chờ', 'text-[#fbbf24]'],
    [String(worklist.length), 'Tổng hôm nay', 'text-[#96ccff]'],
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className="flex min-w-0 items-center gap-2">
          <div className={styles.logoWrap}>
            <Image alt="HMS-VN" className="h-full w-full object-cover" height={34} priority src={`${assetPath}/hospital-logo.jpg`} width={34} />
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
          <AssetIcon className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 opacity-45" name="icon-search.svg" />
          <input
            className={styles.sidebarSearchInput}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Họ tên / số thứ tự..."
            value={searchTerm}
          />
        </label>

        {active.length > 0 && (
          <QueueSection title="Đang khám">
            {active.map((item) => (
              <QueueItem isSelected item={item} key={item.recordId} onClick={() => onSelectPatient(item.recordId)} />
            ))}
          </QueueSection>
        )}

        <QueueSection title="Chờ khám">
          {waiting.length === 0 && <EmptyQueueHint />}
          {waiting.map((item) => (
            <QueueItem item={item} key={item.recordId} onClick={() => onSelectPatient(item.recordId)} />
          ))}
        </QueueSection>

        <QueueSection title="Chờ xét nghiệm">
          {waitingResults.length === 0 && <EmptyQueueHint />}
          {waitingResults.map((item) => (
            <QueueItem item={item} key={item.recordId} onClick={() => onSelectPatient(item.recordId)} />
          ))}
        </QueueSection>

        <QueueSection title="Đã chẩn đoán">
          {diagnosed.length === 0 && <EmptyQueueHint />}
          {diagnosed.map((item) => (
            <QueueItem item={item} key={item.recordId} onClick={() => onSelectPatient(item.recordId)} />
          ))}
        </QueueSection>
      </div>

      <div className={styles.sidebarUser}>
        <Image alt={doctorName} className={styles.userAvatar} height={40} src={`${assetPath}/doctor-avatar.png`} width={40} />
        <div className="min-w-0">
          <p className={styles.userName}>{doctorName}</p>
          <p className={styles.userRole}>Bác sĩ</p>
        </div>
        <button aria-label="Đăng xuất" className={styles.iconButton} type="button">
          <AssetIcon className="h-4 w-4 invert" name="icon-logout.svg" />
        </button>
      </div>
    </aside>
  );
}

function EmptyQueueHint() {
  return <p className="px-4 py-2 text-[11px] text-white/35">Không có bệnh nhân</p>;
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
  isSelected = false,
  item,
  onClick,
}: {
  isSelected?: boolean;
  item: WorklistItem;
  onClick: () => void;
}) {
  const meta = statusMeta(item.status, isSelected);
  return (
    <button
      className={cn(styles.queueItem, isSelected && styles.queueItemActive)}
      onClick={onClick}
      type="button"
    >
      <span className={cn(styles.queueNumber, meta.numberClass)}>{item.recordCode.slice(-2)}</span>
      <span className="min-w-0 flex-1">
        <span className={styles.queueName}>{item.patient.fullName}</span>
        <span className={styles.queueMeta}>
          {calculateAge(item.patient.dateOfBirth)} tuổi · {genderLabel(item.patient.gender)}
        </span>
      </span>
      <span className={cn(styles.queuePill, meta.pillClass)}>{meta.label}</span>
    </button>
  );
}
