import { labWorkspaceStyles as styles } from '../../pages/workspace/lab-workspace.styles';
import { usePendingLabTests } from '../../services/lab-test-api';
import { calculateAge, cn, genderLabel, RESULT_TABLE_LABELS } from '../shared';
import { ResultEntryPanel } from './result-entry-panel';

interface ResultEntryScreenProps {
  onSelect: (labTestId: string | null) => void;
  selectedLabTestId: string | null;
}

export function ResultEntryScreen({ onSelect, selectedLabTestId }: ResultEntryScreenProps) {
  const { data, isLoading } = usePendingLabTests({});
  const list = (data?.data ?? []).filter((item) => item.status !== 'resulted');

  if (selectedLabTestId) {
    return (
      <div>
        <button className={cn(styles.mutedButton, 'mb-4')} onClick={() => onSelect(null)} type="button">
          ← Quay lại danh sách chờ
        </button>
        <ResultEntryPanel key={selectedLabTestId} labTestId={selectedLabTestId} onDone={() => onSelect(null)} />
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Bệnh nhân</th>
            <th className={styles.th}>Loại xét nghiệm</th>
            <th className={styles.th}>Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {isLoading && (
            <tr>
              <td className={styles.td} colSpan={3}>
                Đang tải...
              </td>
            </tr>
          )}
          {!isLoading && list.length === 0 && (
            <tr>
              <td className={cn(styles.td, 'text-center text-[#707882]')} colSpan={3}>
                Không có phiếu nào đang chờ nhập kết quả.
              </td>
            </tr>
          )}
          {!isLoading &&
            list.map((item) => (
              <tr className={styles.rowHover} key={item.labTestId} onClick={() => onSelect(item.labTestId)}>
                <td className={styles.td}>
                  <p className="font-semibold">{item.patient.fullName}</p>
                  <p className="text-xs text-[#707882]">
                    {item.patient.patientCode} · {genderLabel(item.patient.gender)} {calculateAge(item.patient.dateOfBirth)}t
                  </p>
                </td>
                <td className={styles.td}>{RESULT_TABLE_LABELS[item.resultTableKey] ?? item.testName}</td>
                <td className={styles.td}>
                  {item.isUrgent && <span className={cn(styles.chip, styles.chipDanger, 'mr-1')}>Cấp cứu</span>}
                  {item.status === 'in_progress' ? (
                    <span className={cn(styles.chip, styles.chipNeutral)}>Đang thực hiện</span>
                  ) : (
                    <span className={cn(styles.chip, styles.chipPending)}>Chờ mẫu</span>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
