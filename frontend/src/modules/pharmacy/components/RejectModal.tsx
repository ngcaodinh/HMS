import { useState } from 'react';

import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

/**
 * Props của modal trả đơn/hủy đơn.
 * Modal chỉ giữ text input và gọi callback parent; transition `cancelled`, kiểm tra version/quyền/hóa đơn
 * và mọi stock movement hoàn lại đều thuộc backend.
 */
interface RejectModalProps {
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  prescriptionCode: string | null;
}

/**
 * Yêu cầu lý do trước khi parent gửi command trả đơn.
 *
 * @param isSubmitting Trạng thái command đang gửi; khóa nút xác nhận và hiển thị loading.
 * @param onClose Đóng modal khi bấm hủy hoặc vùng nền.
 * @param onConfirm Nhận lý do đã trim để parent gọi API cancel; callback phải xử lý success/error.
 * @param prescriptionCode Mã hiển thị, có thể null nếu response chưa có mã nghiệp vụ.
 * @returns Modal với trạng thái nhập liệu local, guard không rỗng, loading và cancel.
 * @remarks Component không gọi API, không tự chuyển trạng thái và không hiển thị error server; UI guard
 * chỉ đảm bảo có text, còn lý do hợp lệ, permission, version và business transition do backend quyết định.
 */
export function RejectModal({ isSubmitting, onClose, onConfirm, prescriptionCode }: RejectModalProps) {
  const [reason, setReason] = useState('');
  // Guard tối thiểu ở UI; backend vẫn phải validate lý do và quyền hủy đơn.
  const canSubmit = reason.trim().length > 0;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      {/* Chặn click lan ra backdrop để thao tác trong modal không vô tình đóng hộp thoại. */}
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
