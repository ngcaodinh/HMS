import type { ReactNode } from 'react';
import Image from 'next/image';

import { RoleIcon } from '@/shared/components/role-icon';
import { Sidebar as SharedSidebar } from '@/shared/components/sidebar/sidebar';

import type { WorklistItem } from '../types/medical-record.types';
import { AssetIcon, calculateAge, cn, genderLabel } from './shared';
import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

const assetPath = '/doctor-assets';

type QueueBadge = { label: string; numberClass: string; pillClass: string; blink?: boolean };

/** Mirrors GROUP_META badge styling in Tailieu/doctor.html (badge-active/lab/result/done). */
function badgeFor(item: WorklistItem, isSelected: boolean): QueueBadge {
  if (isSelected) {
    return { label: 'Đang khám', numberClass: 'bg-[rgba(96,165,250,0.2)] text-[#93c5fd]', pillClass: 'border-[rgba(96,165,250,0.4)] bg-[rgba(96,165,250,0.2)] text-[#96ccff]' };
  }
  if (item.status === 'closed') {
    return { label: 'Xong', numberClass: 'bg-[rgba(110,231,183,0.15)] text-[#6ee7b7]', pillClass: 'border-[rgba(110,231,183,0.25)] bg-[rgba(110,231,183,0.15)] text-[#6ee7b7]' };
  }
  if (item.status === 'diagnosed') {
    return { label: 'Chờ kê đơn', numberClass: 'bg-[rgba(85,215,237,0.15)] text-[#55d7ed]', pillClass: 'border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.22)] text-[#fbbf24]' };
  }
  if (item.status === 'waiting_results' && item.hasReadyResults) {
    return { label: 'Kết quả mới', numberClass: 'bg-[rgba(85,215,237,0.15)] text-[#55d7ed]', pillClass: 'border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.22)] text-[#fbbf24]', blink: true };
  }
  if (item.status === 'waiting_results') {
    return { label: 'Chờ KQ', numberClass: 'bg-[rgba(85,215,237,0.15)] text-[#55d7ed]', pillClass: 'border-[rgba(85,215,237,0.3)] bg-[rgba(85,215,237,0.15)] text-[#55d7ed]' };
  }
  return { label: 'Chờ khám', numberClass: 'bg-[rgba(251,191,36,0.2)] text-[#fcd34d]', pillClass: 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.2)] text-[#fbbf24]' };
}

export function Sidebar({
  doctorName,
  onLogout,
  onSelectPatient,
  searchTerm,
  onSearchTermChange,
  selectedRecordId,
  worklist,
}: {
  doctorName: string;
  onLogout: () => void;
  onSelectPatient: (recordId: string) => void;
  onSearchTermChange: (value: string) => void;
  searchTerm: string;
  selectedRecordId: string | null;
  worklist: WorklistItem[];
}) {
  const filtered = worklist.filter((item) =>
    item.patient.fullName.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );
  const notSelected = filtered.filter((item) => item.recordId !== selectedRecordId);

  const groups: Array<{ title: string; items: WorklistItem[] }> = [
    { title: 'Đang khám', items: filtered.filter((item) => item.recordId === selectedRecordId) },
    { title: 'Chờ khám', items: notSelected.filter((item) => item.status === 'open') },
    { title: 'Chờ xét nghiệm', items: notSelected.filter((item) => item.status === 'waiting_results' && !item.hasReadyResults) },
    {
      title: 'Có kết quả',
      items: notSelected.filter((item) => item.status === 'diagnosed' || (item.status === 'waiting_results' && item.hasReadyResults)),
    },
    { title: 'Đã khám xong', items: notSelected.filter((item) => item.status === 'closed') },
  ];

  const doneCount = worklist.filter((item) => item.status === 'closed').length;
  const waitingCount = worklist.filter((item) => item.status === 'open' || item.status === 'waiting_results').length;
  const stats: Array<[string, string, string]> = [
    [String(doneCount), 'Đã khám', 'text-[#6ee7b7]'],
    [String(waitingCount), 'Đang chờ', 'text-[#fbbf24]'],
    [String(worklist.length), 'Tổng hôm nay', 'text-[#96ccff]'],
  ];

  return (
    <SharedSidebar
      footer={
        <>
          <div className="relative shrink-0 transition-transform duration-200 hover:scale-105">
            <Image alt={doctorName} className={styles.userAvatar} height={40} src={`${assetPath}/doctor-avatar.png`} width={40} />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#006096] ring-2 ring-[#001d32]">
              <RoleIcon className="h-2.5 w-2.5 text-white" role="doctor" />
            </span>
          </div>
          <div className="min-w-0">
            <p className={styles.userName}>{doctorName}</p>
            <p className={styles.userRole}>Bác sĩ</p>
          </div>
          <button aria-label="Đăng xuất" className={styles.iconButton} onClick={onLogout} type="button">
            <AssetIcon className="h-4 w-4 invert" name="icon-logout.svg" />
          </button>
        </>
      }
      footerClassName="!hidden lg:!flex"
    >
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

        {groups.map(
          (group) =>
            group.items.length > 0 && (
              <QueueSection key={group.title} title={group.title}>
                {group.items.map((item) => (
                  <QueueItem
                    isSelected={item.recordId === selectedRecordId}
                    item={item}
                    key={item.recordId}
                    onClick={() => onSelectPatient(item.recordId)}
                  />
                ))}
              </QueueSection>
            ),
        )}

        {worklist.length === 0 && <p className="px-4 py-3 text-[11px] text-white/35">Không có bệnh nhân trong danh sách.</p>}
      </div>
    </SharedSidebar>
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
  isSelected = false,
  item,
  onClick,
}: {
  isSelected?: boolean;
  item: WorklistItem;
  onClick: () => void;
}) {
  const badge = badgeFor(item, isSelected);
  return (
    <button className={cn(styles.queueItem, isSelected && styles.queueItemActive)} onClick={onClick} type="button">
      <span className={cn(styles.queueNumber, badge.numberClass)}>{item.recordCode.slice(-2)}</span>
      <span className="min-w-0 flex-1">
        <span className={styles.queueName}>{item.patient.fullName}</span>
        <span className={styles.queueMeta}>
          {calculateAge(item.patient.dateOfBirth)} tuổi · {genderLabel(item.patient.gender)}
        </span>
      </span>
      {badge.blink && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#fbbf24]" />}
      <span className={cn(styles.queuePill, badge.pillClass)}>{badge.label}</span>
    </button>
  );
}
