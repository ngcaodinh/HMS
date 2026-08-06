import type { ReactNode } from 'react';
import Image from 'next/image';

import { LogoutButton } from '@/shared/auth/LogoutButton';
import { RoleIcon } from '@/shared/components/RoleIcon';
import { Sidebar as SharedSidebar } from '@/shared/components/sidebar/Sidebar';

import type { WorklistItem } from '../types/medical-record.types';
import { AssetIcon, calculateAge, cn, genderLabel } from './SharedComponents';
import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

const assetPath = '/doctor-assets';

/**
 * Dữ liệu trình bày badge của một mục worklist, gồm màu số thứ tự, nhãn và trạng thái nhấp nháy.
 */
type QueueBadge = { label: string; numberClass: string; pillClass: string; blink?: boolean };

/**
 * Chọn badge theo ưu tiên hồ sơ đang khám, trạng thái hồ sơ và kết quả xét nghiệm đã sẵn sàng.
 *
 * @param item Mục worklist chứa trạng thái server và cờ kết quả mới.
 * @param isSelected Cho biết hồ sơ có đang được mở trong workspace hay không.
 * @returns Nhãn và class trình bày tương ứng với trạng thái của mục worklist.
 */
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

/**
 * Hiển thị worklist của bác sĩ, bộ lọc cục bộ, thống kê trạng thái và nhóm hồ sơ
 * theo tiến trình khám.
 *
 * @param doctorName Tên hiển thị ở chân sidebar; page truyền fallback `Bác sĩ` khi phiên chưa có
 * tên.
 * @param onLogout Callback logout tùy chọn từ workspace; nút hiển thị thực hiện qua `LogoutButton`.
 * @param onSelectPatient Callback nhận `recordId` khi bác sĩ chọn một hồ sơ.
 * @param onSearchTermChange Callback cập nhật từ khóa tìm kiếm ở local state của page.
 * @param searchTerm Từ khóa hiện tại, dùng lọc theo họ tên bệnh nhân ở client.
 * @param selectedRecordId ID hồ sơ đang mở để đánh dấu nhóm Đang khám.
 * @param worklist Worklist server; mảng rỗng biểu thị trạng thái không có bệnh nhân hoặc đang chờ
 * tải.
 * @returns Sidebar với trạng thái loading do page điều phối, nhóm rỗng và các mục worklist thành
 * công.
 *
 * @remarks Sidebar chỉ kiểm soát khả năng hiển thị/chọn hồ sơ ở UI; authorization vẫn do
 * backend/API.
 */
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
  onLogout?: () => void;
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

  // Tách hồ sơ đang chọn khỏi các nhóm còn lại để không lặp record và luôn giữ ngữ cảnh
  // đang khám ở đầu.
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
  // Thống kê lấy từ toàn bộ worklist server, không bị ảnh hưởng bởi từ khóa lọc đang nhập.
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
          <div className="min-w-0 flex-1">
            <p className={styles.userName}>{doctorName}</p>
            <p className={styles.userRole}>Bác sĩ</p>
          </div>
          <LogoutButton
            ariaLabel="Đăng xuất"
            className={styles.iconButton}
            title="Đăng xuất"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" x2="9" y1="12" y2="12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </LogoutButton>
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

/** Gom các mục worklist thành một nhóm có tiêu đề trong sidebar. */
function QueueSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div>
      <p className={styles.sidebarSection}>{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** Hiển thị một hồ sơ trong worklist cùng số thứ tự, thông tin tóm tắt và badge trạng thái. */
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
