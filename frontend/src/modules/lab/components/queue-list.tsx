import { labWorkspaceStyles as styles } from '../pages/workspace/lab-workspace.styles';
import type { LabTestQueueItem } from '../types/lab-test.types';
import { AssetIcon, calculateAge, cn, formatDateTimeVN, genderLabel, RESULT_TABLE_LABELS } from './shared';

export type QueueFilterTab = 'all' | 'ordered' | 'in_progress' | 'urgent';

interface QueueListProps {
  filterTab: QueueFilterTab;
  isLoading: boolean;
  keyword: string;
  list: LabTestQueueItem[];
  onChangeFilterTab: (value: QueueFilterTab) => void;
  onChangeKeyword: (value: string) => void;
  onPrint: (labTestId: string) => void;
  onSelect: (labTestId: string) => void;
}

function statusChip(status: LabTestQueueItem['status']) {
  if (status === 'resulted') return <span className={cn(styles.chip, styles.chipDone)}>Đã có kết quả</span>;
  if (status === 'in_progress') return <span className={cn(styles.chip, styles.chipNeutral)}>Đang thực hiện</span>;
  return <span className={cn(styles.chip, styles.chipPending)}>Chờ mẫu</span>;
}

export function QueueList({
  filterTab,
  isLoading,
  keyword,
  list,
  onChangeFilterTab,
  onChangeKeyword,
  onPrint,
  onSelect,
}: QueueListProps) {
  const waitingCount = list.filter((item) => item.status === 'ordered').length;
  const inProgressCount = list.filter((item) => item.status === 'in_progress').length;
  const urgentCount = list.filter((item) => item.isUrgent && item.status !== 'resulted').length;

  const byTab = list.filter((item) => {
    if (filterTab === 'ordered') return item.status === 'ordered';
    if (filterTab === 'in_progress') return item.status === 'in_progress';
    if (filterTab === 'urgent') return item.isUrgent;
    return true;
  });
  const filtered = byTab.filter((item) => {
    const term = keyword.trim().toLowerCase();
    if (!term) return true;
    return (
      item.patient.fullName.toLowerCase().includes(term) ||
      item.patient.patientCode.toLowerCase().includes(term) ||
      item.labTestId.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: '#ffecd4' }}>
            <AssetIcon className="h-5 w-5" name="icon-lab-order.svg" />
          </div>
          <div>
            <p className={styles.statValue}>{waitingCount}</p>
            <p className={styles.statLabel}>Chờ mẫu</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: '#dbeafe' }}>
            <AssetIcon className="h-5 w-5" name="icon-lab-result.svg" />
          </div>
          <div>
            <p className={styles.statValue}>{inProgressCount}</p>
            <p className={styles.statLabel}>Đang thực hiện</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: '#fee2e2' }}>
            <AssetIcon className="h-5 w-5" name="icon-close.svg" />
          </div>
          <div>
            <p className={styles.statValue}>{urgentCount}</p>
            <p className={styles.statLabel}>Cấp cứu</p>
          </div>
        </div>
      </div>

      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <AssetIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" name="icon-search.svg" />
          <input
            className={styles.searchInput}
            onChange={(event) => onChangeKeyword(event.target.value)}
            placeholder="Tìm theo tên, mã bệnh án hoặc quét barcode..."
            value={keyword}
          />
        </div>
        <button
          className={cn(styles.filterTab, filterTab === 'all' && styles.filterTabActive)}
          onClick={() => onChangeFilterTab('all')}
          type="button"
        >
          Tất cả
        </button>
        <button
          className={cn(styles.filterTab, filterTab === 'ordered' && styles.filterTabActive)}
          onClick={() => onChangeFilterTab('ordered')}
          type="button"
        >
          Chờ tiếp nhận
        </button>
        <button
          className={cn(styles.filterTab, filterTab === 'in_progress' && styles.filterTabActive)}
          onClick={() => onChangeFilterTab('in_progress')}
          type="button"
        >
          Đang thực hiện
        </button>
        <button
          className={cn(styles.filterTab, filterTab === 'urgent' && styles.filterTabDangerActive, filterTab !== 'urgent' && styles.filterTabDanger)}
          onClick={() => onChangeFilterTab('urgent')}
          type="button"
        >
          Cấp cứu
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>STT / Mã phiếu</th>
              <th className={styles.th}>Bệnh nhân</th>
              <th className={styles.th}>Loại xét nghiệm</th>
              <th className={styles.th}>Nguồn chỉ định</th>
              <th className={styles.th}>Thời gian</th>
              <th className={styles.th}>Trạng thái</th>
              <th className={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {isLoading && (
              <tr>
                <td className={styles.td} colSpan={7}>
                  Đang tải hàng đợi...
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td className={cn(styles.td, 'text-center text-[#707882]')} colSpan={7}>
                  Không có phiếu xét nghiệm nào phù hợp.
                </td>
              </tr>
            )}
            {!isLoading &&
              filtered.map((item) => (
                <tr className={cn(item.isUrgent && 'bg-[#fff5f4]')} key={item.labTestId}>
                  <td className={styles.td}>
                    <p className="font-bold text-[#006096]">
                      #{item.reportCode ?? item.labTestId.slice(0, 8).toUpperCase()}
                    </p>
                    {item.isUrgent && <span className={cn(styles.chip, styles.chipDanger, 'mt-1')}>Cấp cứu</span>}
                  </td>
                  <td className={styles.td}>
                    <p className="font-semibold">{item.patient.fullName}</p>
                    <p className="text-xs text-[#707882]">
                      {item.patient.patientCode} · {genderLabel(item.patient.gender)} {calculateAge(item.patient.dateOfBirth)}t
                    </p>
                  </td>
                  <td className={styles.td}>{RESULT_TABLE_LABELS[item.resultTableKey] ?? item.testName}</td>
                  <td className={styles.td}>
                    <p>{item.department?.name ?? '—'}</p>
                    <p className="text-xs text-[#707882]">BS. {item.orderingDoctor.fullName}</p>
                  </td>
                  <td className={styles.td}>{formatDateTimeVN(item.createdAt)}</td>
                  <td className={styles.td}>{statusChip(item.status)}</td>
                  <td className={styles.td}>
                    <div className={styles.actionCellRow}>
                      {item.status !== 'resulted' ? (
                        <button className={styles.smallPrimaryButton} onClick={() => onSelect(item.labTestId)} type="button">
                          <AssetIcon className="h-3.5 w-3.5" name="icon-save.svg" />
                          Nhập KQ
                        </button>
                      ) : (
                        <button className={styles.mutedButton} onClick={() => onSelect(item.labTestId)} type="button">
                          Xem
                        </button>
                      )}
                      <button aria-label="In phiếu" className={styles.smallIconButton} onClick={() => onPrint(item.labTestId)} type="button">
                        <span className="text-[10px] font-bold">In</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
