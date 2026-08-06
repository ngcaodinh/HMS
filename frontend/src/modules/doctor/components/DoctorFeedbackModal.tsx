'use client';

import React, { useEffect, useRef } from 'react';

import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

/** Sắc thái hiển thị cho lỗi, thông tin hoặc xác nhận thao tác nghiệp vụ. */
export type DoctorFeedbackTone = 'danger' | 'info' | 'success';

/** Props của dialog feedback dùng chung trong workflow bác sĩ. */
interface DoctorFeedbackModalProps {
  message: string;
  onClose: () => void;
  title: string;
  tone?: DoctorFeedbackTone;
}

/**
 * Hiển thị thông báo server/nghiệp vụ bằng dialog chung của workspace bác sĩ.
 * @param message Nội dung lỗi/thông tin đã được caller ánh xạ an toàn từ kết quả thao tác.
 * @param onClose Callback đóng dialog bằng nút hoặc phím Escape.
 * @param title Tiêu đề dialog.
 * @param tone Sắc thái `danger`, `info` hoặc `success`; mặc định là `danger`.
 * @returns Dialog modal có focus ban đầu ở nút đóng và trạng thái ARIA tương ứng.
 * @remarks Component không tự gọi API, không có loading/empty state; message/title do caller cung
 *   cấp. Focus và listener bàn phím được dọn khi dialog unmount. UI hiển thị không thay thế quyền API.
 */
export function DoctorFeedbackModal({
  message,
  onClose,
  title,
  tone = 'danger',
}: DoctorFeedbackModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = 'doctor-feedback-modal-title';
  const messageId = 'doctor-feedback-modal-message';

  // Mỗi lần mở dialog, đưa focus vào nút đóng và lắng nghe Escape; cleanup tránh listener tồn tại sau unmount.
  useEffect(() => {
    closeButtonRef.current?.focus();

    // Escape là thao tác đóng dialog; callback của caller chịu trách nhiệm cập nhật state/mutation liên quan.
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const headerClassName =
    tone === 'danger'
      ? styles.modalDangerHeader
      : tone === 'success'
        ? styles.modalSuccessHeader
        : styles.modalInfoHeader;

  return (
    <div className={styles.modalOverlay}>
      <div
        aria-describedby={messageId}
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.modalCard}
        role="dialog"
      >
        <div className={headerClassName}>
          <h2 className="text-sm font-extrabold" id={titleId}>
            {title}
          </h2>
        </div>
        <p className="px-5 py-5 text-sm leading-6 text-[#3f4851]" id={messageId}>
          {message}
        </p>
        <div className={styles.modalFooter}>
          <button
            aria-label="Đóng thông báo"
            className={styles.mutedButton}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
