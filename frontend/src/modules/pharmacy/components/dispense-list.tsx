import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';
import type { DispensablePrescription } from '../types/prescription-dispense.types';
import { AssetIcon, calculateAge, cn, genderLabel } from './shared';

interface DispenseListProps {
  isLoading: boolean;
  keyword: string;
  list: DispensablePrescription[];
  onChangeKeyword: (value: string) => void;
  onChangeStatusFilter: (value: 'pending' | 'dispensed') => void;
  onSelect: (prescriptionId: string) => void;
  selectedId: string | null;
  statusFilter: 'pending' | 'dispensed';
}

export function DispenseList({
  isLoading,
  keyword,
  list,
  onChangeKeyword,
  onChangeStatusFilter,
  onSelect,
  selectedId,
  statusFilter,
}: DispenseListProps) {
  const allergyCount = list.filter((item) => Boolean(item.allergyOverrideReason)).length;

  return (
    <>
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <AssetIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" name="icon-search.svg" />
          <input
            className={styles.searchInput}
            onChange={(event) => onChangeKeyword(event.target.value)}
            placeholder="Tìm theo Mã đơn, Mã BN, Họ tên, Bác sĩ kê đơn..."
            value={keyword}
          />
        </div>
        <button
          className={cn(styles.filterTab, statusFilter === 'pending' && styles.filterTabActive)}
          onClick={() => onChangeStatusFilter('pending')}
          type="button"
        >
          Chờ cấp phát
        </button>
        <button
          className={cn(styles.filterTab, statusFilter === 'dispensed' && styles.filterTabActive)}
          onClick={() => onChangeStatusFilter('dispensed')}
          type="button"
        >
          Đã cấp phát
        </button>
        {allergyCount > 0 && (
          <span className={cn(styles.chip, styles.chipWarning)}>{allergyCount} cảnh báo dị ứng</span>
        )}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Mã đơn thuốc</th>
              <th className={styles.th}>Bệnh nhân &amp; BHYT</th>
              <th className={styles.th}>Khoa / Bác sĩ kê đơn</th>
              <th className={styles.th}>Cảnh báo chuyên môn</th>
              <th className={styles.th}>Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {isLoading && (
              <tr>
                <td className={styles.td} colSpan={5}>
                  Đang tải danh sách đơn thuốc...
                </td>
              </tr>
            )}
            {!isLoading && list.length === 0 && (
              <tr>
                <td className={cn(styles.td, 'text-center text-[#707882]')} colSpan={5}>
                  Không có đơn thuốc nào phù hợp.
                </td>
              </tr>
            )}
            {!isLoading &&
              list.map((prescription) => (
                <tr
                  className={cn(styles.rowHover, selectedId === prescription.prescriptionId && styles.rowActive)}
                  key={prescription.prescriptionId}
                  onClick={() => onSelect(prescription.prescriptionId)}
                >
                  <td className={cn(styles.td, 'font-bold text-[#006096]')}>
                    #{prescription.prescriptionCode ?? prescription.prescriptionId.slice(0, 8)}
                  </td>
                  <td className={styles.td}>
                    <p className="font-semibold">{prescription.patient.fullName}</p>
                    <p className="text-xs text-[#707882]">
                      {prescription.patient.patientCode} · {genderLabel(prescription.patient.gender)}{' '}
                      {calculateAge(prescription.patient.dateOfBirth)}t
                      {prescription.patient.healthInsuranceCode ? ' · Có BHYT' : ' · Không BHYT'}
                    </p>
                  </td>
                  <td className={styles.td}>
                    <p>{prescription.department?.name ?? '—'}</p>
                    <p className="text-xs text-[#707882]">BS. {prescription.prescribingDoctor.fullName}</p>
                  </td>
                  <td className={styles.td}>
                    {prescription.allergyOverrideReason ? (
                      <span className={cn(styles.chip, styles.chipWarning)}>Cảnh báo dị ứng</span>
                    ) : (
                      <span className="text-xs text-[#707882]">—</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    {prescription.dispensedAt ? (
                      <span className={cn(styles.chip, styles.chipDone)}>Đã phát</span>
                    ) : (
                      <span className={cn(styles.chip, styles.chipPending)}>Chờ phát</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
