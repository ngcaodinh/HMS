'use client';

import React, { useEffect, useRef } from 'react';

import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

export type DoctorFeedbackTone = 'danger' | 'info' | 'success';

interface DoctorFeedbackModalProps {
  message: string;
  onClose: () => void;
  title: string;
  tone?: DoctorFeedbackTone;
}

/** Hiển thị thông báo server/nghiệp vụ bằng dialog chung, có thể đóng bằng Escape hoặc nút Đóng. */
export function DoctorFeedbackModal({
  message,
  onClose,
  title,
  tone = 'danger',
}: DoctorFeedbackModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = 'doctor-feedback-modal-title';
  const messageId = 'doctor-feedback-modal-message';

  useEffect(() => {
    closeButtonRef.current?.focus();

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
