import { useState } from 'react';

import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

interface RejectModalProps {
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  prescriptionCode: string | null;
}

export function RejectModal({ isSubmitting, onClose, onConfirm, prescriptionCode }: RejectModalProps) {
  const [reason, setReason] = useState('');
  const canSubmit = reason.trim().length > 0;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <p className={styles.modalTitle}>Từ chối / Trả đơn #{prescriptionCode ?? ''}</p>
        <p className={styles.modalSubtitle}>Đơn thuốc sẽ chuyển sang trạng thái đã hủy và trả lại cho bác sĩ kê đơn.</p>
        <textarea
          className={styles.textarea}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Lý do từ chối / trả đơn (VD: thiếu thông tin, nghi vấn tương tác thuốc...)"
          value={reason}
        />
        <div className={styles.modalActions}>
          <button className={styles.mutedButton} onClick={onClose} type="button">
            Hủy
          </button>
          <button
            className={styles.dangerButton}
            disabled={!canSubmit || isSubmitting}
            onClick={() => onConfirm(reason.trim())}
            type="button"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
}
