import { labWorkspaceStyles as styles } from '../pages/workspace/lab-workspace.styles';
import type { LabTestQueueItem } from '../types/lab-test.types';
import { AssetIcon, calculateAge, cn, formatDateTimeVN, genderLabel, RESULT_TABLE_LABELS } from './shared';

interface HistoryListProps {
  isLoading: boolean;
  keyword: string;
  list: LabTestQueueItem[];
  onChangeKeyword: (value: string) => void;
  onSelect: (labTestId: string) => void;
  selectedId: string | null;
}

export function HistoryList({ isLoading, keyword, list, onChangeKeyword, onSelect, selectedId }: HistoryListProps) {
  const filtered = list.filter((item) => {
    const term = keyword.trim().toLowerCase();
    if (!term) return true;
    return (
      item.patient.fullName.toLowerCase().includes(term) || item.patient.patientCode.toLowerCase().includes(term)
    );
  });

  return (
    <div className={styles.card}>
      <label className="relative mb-4 block">
        <AssetIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" name="icon-search.svg" />
        <input
          className={styles.searchInput}
          onChange={(event) => onChangeKeyword(event.target.value)}
          placeholder="Tên bệnh nhân, mã BN..."
          value={keyword}
        />
      </label>
      <div className="flex max-h-[70vh] flex-col gap-2 overflow-auto">
        {isLoading && <p className="text-sm text-[#707882]">Đang tải...</p>}
        {!isLoading && filtered.length === 0 && <p className="text-sm text-[#707882]">Không có kết quả nào.</p>}
        {!isLoading &&
          filtered.map((item) => (
            <button
              className={cn(
                'rounded-md border border-[#e5e7eb] px-3 py-2.5 text-left transition hover:bg-[#f6fafe]',
                selectedId === item.labTestId && 'border-[#006096] bg-[#eef8ff]',
              )}
              key={item.labTestId}
              onClick={() => onSelect(item.labTestId)}
              type="button"
            >
              <p className="text-[13px] font-semibold">{item.patient.fullName}</p>
              <p className="text-xs text-[#707882]">
                {item.patient.patientCode} · {genderLabel(item.patient.gender)} {calculateAge(item.patient.dateOfBirth)}t
              </p>
              <p className="mt-1 text-xs text-[#707882]">{formatDateTimeVN(item.createdAt)}</p>
              <span className={cn(styles.chip, styles.chipNeutral, 'mt-1')}>{RESULT_TABLE_LABELS[item.resultTableKey]}</span>
            </button>
          ))}
      </div>
    </div>
  );
}
