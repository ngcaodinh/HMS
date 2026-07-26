import { useState } from 'react';

import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';
import type { DispensablePrescription } from '../types/prescription-dispense.types';
import { printDispenseLabel } from './print-label';
import { RejectModal } from './reject-modal';
import { calculateAge, cn, formatDateTimeVN, genderLabel } from './shared';

interface DispenseDetailProps {
  isDispensing: boolean;
  isRejecting: boolean;
  onDispense: () => void;
  onReject: (reason: string) => void;
  prescription: DispensablePrescription;
}

export function DispenseDetail({ isDispensing, isRejecting, onDispense, onReject, prescription }: DispenseDetailProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const isDispensed = Boolean(prescription.dispensedAt);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <p className={styles.cardTitle}>
          Chi tiết đơn thuốc điện tử: #{prescription.prescriptionCode ?? prescription.prescriptionId.slice(0, 8)}
        </p>
        {isDispensed ? (
          <span className={cn(styles.chip, styles.chipDone)}>Đã cấp phát</span>
        ) : (
          <span className={cn(styles.chip, styles.chipPending)}>Chờ cấp phát</span>
        )}
      </div>

      <div className={styles.infoGrid}>
        <div>
          <p className={styles.metricLabel}>Bệnh nhân</p>
          <p className={styles.metricValue}>
            {prescription.patient.fullName} ({calculateAge(prescription.patient.dateOfBirth) ?? '—'} tuổi ·{' '}
            {genderLabel(prescription.patient.gender)})
          </p>
        </div>
        <div>
          <p className={styles.metricLabel}>Mã BN / BHYT</p>
          <p className={styles.metricValue}>
            {prescription.patient.patientCode}
            {prescription.patient.healthInsuranceCode ? ` · ${prescription.patient.healthInsuranceCode}` : ''}
          </p>
        </div>
        <div>
          <p className={styles.metricLabel}>Chẩn đoán (ICD-10)</p>
          <p className={styles.metricValue}>
            {prescription.diagnosis ? `${prescription.diagnosis.diagnosisText ?? ''} (${prescription.diagnosis.icd10})` : '—'}
          </p>
        </div>
        <div>
          <p className={styles.metricLabel}>Bác sĩ kê đơn</p>
          <p className={styles.metricValue}>
            BS. {prescription.prescribingDoctor.fullName}
            {prescription.department ? ` (${prescription.department.name})` : ''}
          </p>
        </div>
      </div>

      {prescription.allergyOverrideReason && (
        <div className={styles.alertDanger}>
          <p className="font-bold">Cảnh báo dị ứng &amp; ghi đè chuyên môn (Allergy Override)</p>
          <p className="mt-1">
            Bệnh nhân có tiền sử dị ứng: <strong>{prescription.patient.allergies}</strong>. Bác sĩ kê đơn đã xác nhận
            ghi đè: “{prescription.allergyOverrideReason}”
            {prescription.allergyOverrideAt ? ` · ${formatDateTimeVN(prescription.allergyOverrideAt)}` : ''}
          </p>
        </div>
      )}

      <div className={styles.itemsTableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Tên thuốc / Hoạt chất</th>
              <th className={styles.th}>SL</th>
              <th className={styles.th}>Liều dùng &amp; hướng dẫn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {prescription.items.map((item) => (
              <tr key={item.prescriptionItemId}>
                <td className={styles.td}>
                  <p className="font-semibold">{item.medicineNameSnapshot ?? '—'}</p>
                  {item.activeIngredientSnapshot && (
                    <p className="text-xs text-[#707882]">{item.activeIngredientSnapshot}</p>
                  )}
                </td>
                <td className={styles.td}>
                  {item.quantity} · {item.days} ngày
                </td>
                <td className={styles.td}>
                  {item.dosePerUse ? `${item.dosePerUse} · ` : ''}
                  {item.dosageInstruction}
                  {item.useTiming ? ` (${item.useTiming})` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isDispensed ? (
        <p className="text-right text-xs text-[#707882]">
          Đã cấp phát lúc {formatDateTimeVN(prescription.dispensedAt as string)}
        </p>
      ) : (
        <div className={styles.actionRow}>
          <button className={styles.dangerButton} onClick={() => setShowRejectModal(true)} type="button">
            Từ chối / Trả đơn
          </button>
          <button className={styles.outlineButton} onClick={() => printDispenseLabel(prescription)} type="button">
            In nhãn hướng dẫn
          </button>
          <button className={styles.primaryButton} disabled={isDispensing} onClick={onDispense} type="button">
            {isDispensing ? 'Đang xử lý...' : 'Xác nhận cấp phát'}
          </button>
        </div>
      )}

      {showRejectModal && (
        <RejectModal
          isSubmitting={isRejecting}
          onClose={() => setShowRejectModal(false)}
          onConfirm={(reason) => {
            onReject(reason);
            setShowRejectModal(false);
          }}
          prescriptionCode={prescription.prescriptionCode}
        />
      )}
    </div>
  );
}
