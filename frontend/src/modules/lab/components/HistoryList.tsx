import { labWorkspaceStyles as styles } from '../pages/workspace/lab-workspace.styles';
import type { LabTestQueueItem } from '../types/lab-test.types';
import { AssetIcon, calculateAge, cn, formatDateTimeVN, genderLabel, RESULT_TABLE_LABELS } from './SharedComponents';

interface HistoryListProps {
  isLoading: boolean;
  keyword: string;
  list: LabTestQueueItem[];
  onChangeKeyword: (value: string) => void;
  onSelect: (labTestId: string) => void;
  selectedId: string | null;
}

/**
 * Hiển thị danh sách phiếu đã có kết quả và cho phép chọn một phiếu xem chi tiết.
 *
 * @param props.isLoading Trạng thái query history; khi true chỉ hiển thị loading.
 * @param props.keyword Từ khóa lọc cục bộ theo tên bệnh nhân.
 * @param props.list Danh sách `LabTestQueueItem` đã được API lọc trạng thái `resulted`.
 * @param props.onChangeKeyword Callback cập nhật từ khóa ở component cha.
 * @param props.onSelect Callback phát mã phiếu được chọn để tải chi tiết.
 * @param props.selectedId Mã phiếu đang chọn để đánh dấu hàng hiện tại.
 * @returns UI loading, empty hoặc danh sách history thành công.
 * @remarks Component không tự gọi API và không có nhánh lỗi/forbidden riêng; backend vẫn là nơi
 * quyết định quyền đọc lịch sử, còn component này chỉ lọc và điều phối lựa chọn.
 */
export function HistoryList({ isLoading, keyword, list, onChangeKeyword, onSelect, selectedId }: HistoryListProps) {
  // Lọc nhanh trên dữ liệu đã tải; query trạng thái và access boundary do component cha/API đảm nhiệm.
  const filtered = list.filter((item) => item.patient.fullName.toLowerCase().includes(keyword.trim().toLowerCase()));

  return (
    <div className={styles.card}>
      <label className="relative mb-4 block">
        <AssetIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 brightness-0" name="icon-search.svg" />
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
                'rounded-md border border-[#e5e7eb] px-3 py-2.5 text-left transition duration-150 hover:bg-[#f6fafe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006096]/30 focus-visible:ring-offset-1',
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
