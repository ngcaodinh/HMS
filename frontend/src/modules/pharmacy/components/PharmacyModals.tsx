/**
 * @file PharmacyModals.tsx
 * @description Tập hợp các hộp thoại Modal tương tác cho Phân hệ Dược sĩ & Nhà thuốc
 * @author Senior Frontend Engineer
 */

'use client';

import React, { useState } from 'react';
import type { Prescription } from '../types/pharmacy.types';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

interface PharmacyModalsProps {
  /** Modal đang mở hoặc null nếu đóng */
  activeModal: 'dispense' | 'reject' | 'import-xml' | 'logout' | null;
  /** Đơn thuốc đang được xử lý trong modal */
  prescription: Prescription | null;
  /** Hàm đóng modal */
  onCloseModal: () => void;
  /** Hàm xác nhận phát thuốc */
  onConfirmDispense: () => void;
  /** Hàm xác nhận từ chối đơn thuốc */
  onConfirmReject: (reason: string) => void;
  /** Hàm xác nhận Import XML phiếu nhập */
  onConfirmXmlImport: () => void;
  /** Hàm xác nhận đăng xuất */
  onConfirmLogout: () => void;
}

export const PharmacyModals: React.FC<PharmacyModalsProps> = ({
  activeModal,
  prescription,
  onCloseModal,
  onConfirmDispense,
  onConfirmReject,
  onConfirmXmlImport,
  onConfirmLogout,
}) => {
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string>('');

  if (!activeModal) return null;

  const handleRejectSubmit = () => {
    if (rejectReason.trim().length < 10) {
      setRejectError('Vui lòng nhập lý do từ chối tối thiểu 10 ký tự.');
      return;
    }
    setRejectError('');
    onConfirmReject(rejectReason);
    setRejectReason('');
  };

  return (
    <>
      {/* Modal 1: Confirm Dispense */}
      {activeModal === 'dispense' && prescription && (
        <div className={styles.modalOverlay} onClick={onCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#cee5ff] text-[#006096]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <div className={styles.modalTitle}>Xác nhận cấp phát thuốc &amp; Trừ kho FEFO</div>
                <div className={styles.modalSub}>
                  Đơn thuốc #RX-2026-{prescription.id} · Bệnh nhân: {prescription.patientName}
                </div>
              </div>
            </div>

            <div className={styles.modalBody}>
              <ul className="mb-4 space-y-2">
                <li className="flex items-center gap-2.5 rounded-lg bg-[#f0f4f8] p-2.5 text-[13px] text-[#171c1f]">
                  <svg className="w-4 h-4 shrink-0 text-[#1a7a4a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    Đúng bệnh nhân: <strong>{prescription.patientName}</strong> (
                    <span className="font-mono">{prescription.patientId}</span>)
                  </span>
                </li>

                <li className="flex items-center gap-2.5 rounded-lg bg-[#f0f4f8] p-2.5 text-[13px] text-[#171c1f]">
                  <svg className="w-4 h-4 shrink-0 text-[#1a7a4a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    Đúng đơn thuốc &amp; chữ ký bác sĩ (<strong>{prescription.doctorName}</strong> — 「Đã ký」)
                  </span>
                </li>

                <li className="flex items-center gap-2.5 rounded-lg bg-[#f0f4f8] p-2.5 text-[13px] text-[#171c1f]">
                  <svg className="w-4 h-4 shrink-0 text-[#1a7a4a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    Đúng <strong>{prescription.items.length}</strong> khoản thuốc &amp; liều dùng
                  </span>
                </li>

                <li className="flex items-center gap-2.5 rounded-lg bg-[#f0f4f8] p-2.5 text-[13px] text-[#171c1f]">
                  <svg className="w-4 h-4 shrink-0 text-[#1a7a4a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    Đã gán trừ lô FEFO:{' '}
                    {prescription.items.map((i, idx) => (
                      <span key={idx} className="font-mono font-bold text-[#006096]">
                        {i.fefoLotNumber}
                        {idx < prescription.items.length - 1 ? ' & ' : ''}
                      </span>
                    ))}
                  </span>
                </li>
              </ul>

              <div className={`${styles.alert} ${styles.alertInfo}`}>
                <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div>
                  Hệ thống sẽ lưu vết <code>dispensedBy = DS. Phạm Thanh Hà</code> và thời điểm phát{' '}
                  <code>dispensedAt</code>. Đơn thuốc sau khi phát sẽ không được chỉnh sửa.
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={onCloseModal}
                aria-label="Hủy thao tác"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={onConfirmDispense}
                aria-label="Xác nhận cấp phát đơn thuốc"
              >
                Xác nhận phát thuốc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Reject Prescription */}
      {activeModal === 'reject' && prescription && (
        <div className={styles.modalOverlay} onClick={onCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ffdad6] text-[#ba1a1a]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div>
                <div className={styles.modalTitle}>Từ chối cấp phát đơn thuốc</div>
                <div className={styles.modalSub}>
                  Gửi yêu cầu điều chỉnh đơn thuốc cho Bác sĩ kê đơn ({prescription.doctorName})
                </div>
              </div>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="textarea-reject">
                  Lý do từ chối cấp phát * (tối thiểu 10 ký tự)
                </label>
                <textarea
                  id="textarea-reject"
                  rows={3}
                  className={`${styles.formControl} resize-y min-h-[84px]`}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do chuyên môn: Tương tác thuốc nguy hiểm, Thuốc tạm hết hàng..."
                />
                {rejectError && <p className="mt-1 text-[12px] font-semibold text-[#ba1a1a]">{rejectError}</p>}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={onCloseModal}
                aria-label="Hủy bỏ"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnError}`}
                onClick={handleRejectSubmit}
                aria-label="Xác nhận gửi phản hồi từ chối"
              >
                Gửi phản hồi cho Bác sĩ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Import XML Stock Receipt */}
      {activeModal === 'import-xml' && (
        <div className={styles.modalOverlay} onClick={onCloseModal}>
          <div className={`${styles.modal} max-w-[620px]`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#cee5ff] text-[#006096]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <polyline points="12,18 12,12" />
                  <polyline points="9,15 12,12 15,15" />
                </svg>
              </div>
              <div>
                <div className={styles.modalTitle}>Import phiếu nhập kho từ tệp XML Hóa đơn</div>
                <div className={styles.modalSub}>
                  Hỗ trợ XML Hóa đơn GTGT Nhà cung cấp &amp; XML Dược quốc gia (Thông tư 26/BYT)
                </div>
              </div>
            </div>

            <div className={styles.modalBody}>
              {/* File Dropzone */}
              <div className="mb-4 border-2 border-dashed border-[#bfc7d2] rounded-2xl p-6 text-center bg-[#f0f4f8] cursor-pointer hover:border-[#006096] transition-colors">
                <svg className="w-10 h-10 text-[#006096] mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="font-semibold text-[14px] text-[#171c1f] mb-1">
                  Kéo thả tệp XML vào đây hoặc nhấp để chọn tệp
                </div>
                <div className="text-[12px] text-[#3f4851]">Chấp nhận định dạng: .xml (Dung lượng tối đa 10MB)</div>
              </div>

              {/* Sample preview box */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className={styles.formLabel} style={{ marginBottom: 0 }}>
                    Xem trước cấu trúc tệp XML mẫu (XML-HD-2026-9921.xml):
                  </label>
                </div>
                <pre className="max-h-[180px] overflow-x-auto rounded-xl bg-[#1e293b] p-3 font-mono text-[11px] text-[#e2e8f0]">
                  {`<?xml version="1.0" encoding="UTF-8"?>
<HOA_DON_DUOC_NHAP_KHO xmlns="http://bythealth.gov.vn/nhapkho/2026">
  <NHA_CUNG_CAP>Công ty Dược phẩm TW1 (CPC1)</NHA_CUNG_CAP>
  <SO_HOA_DON>HD-XML-2026-9921</SO_HOA_DON>
  <NGAY_HOA_DON>2026-07-20</NGAY_HOA_DON>
  <DANH_SACH_THUOC_NHAP>
    <ITEM>
      <TEN_THUOC>Clobetasol Propionate 0.05% (Tuýp 30g)</TEN_THUOC>
      <SO_LO>LOT-20260799</SO_LO>
      <SO_LUONG>500</SO_LUONG>
      <DON_GIA>38000</DON_GIA>
    </ITEM>
  </DANH_SACH_THUOC_NHAP>
</HOA_DON_DUOC_NHAP_KHO>`}
                </pre>
              </div>

              <div className={`${styles.alert} ${styles.alertInfo} mb-0`}>
                <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div>Dữ liệu từ tệp XML sẽ được tự động điền vào biểu mẫu nhập kho và danh mục các lô thuốc.</div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={onCloseModal}
                aria-label="Hủy bỏ"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={onConfirmXmlImport}
                aria-label="Xác nhận Import vào phiếu nhập"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Xác nhận Import vào phiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Logout */}
      {activeModal === 'logout' && (
        <div className={styles.modalOverlay} onClick={onCloseModal}>
          <div className={`${styles.modal} max-w-[360px]`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ffdad6] text-[#ba1a1a]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div>
                <div className={styles.modalTitle}>Đăng xuất hệ thống</div>
                <div className={styles.modalSub}>Bạn có chắc muốn kết thúc ca trực?</div>
              </div>
            </div>

            <div className={styles.modalBody}>
              <div className={`${styles.alert} ${styles.alertWarning}`}>
                <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div>Vui lòng đảm bảo đã hoàn tất các đơn thuốc cấp phát trong ca trước khi đăng xuất.</div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={onCloseModal}
                aria-label="Ở lại hệ thống"
              >
                Ở lại
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnError}`}
                onClick={onConfirmLogout}
                aria-label="Đăng xuất"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
