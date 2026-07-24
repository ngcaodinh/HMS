/**
 * @file PrescriptionDispenseScreen.tsx
 * @description Màn hình 1: Cấp phát thuốc theo đơn & Khung xử lý trừ kho FEFO
 * @author Senior Frontend Engineer
 */

'use client';

import React, { useMemo, useState } from 'react';
import type { Prescription } from '../types/pharmacy.types';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

interface PrescriptionDispenseScreenProps {
  prescriptions: Prescription[];
  selectedPrescriptionId: string;
  onSelectPrescription: (id: string) => void;
  onReloadQueue: () => void;
  onOpenDispenseModal: (rx: Prescription) => void;
  onOpenRejectModal: (rx: Prescription) => void;
  onPrintLabel: (rx: Prescription) => void;
}

type ChipFilter = 'pending' | 'dispensed' | 'outpatient' | 'inpatient' | 'allergy' | 'all';

export const PrescriptionDispenseScreen: React.FC<PrescriptionDispenseScreenProps> = ({
  prescriptions,
  selectedPrescriptionId,
  onSelectPrescription,
  onReloadQueue,
  onOpenDispenseModal,
  onOpenRejectModal,
  onPrintLabel,
}) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('kho-a');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeChip, setActiveChip] = useState<ChipFilter>('pending');

  // Lọc danh sách đơn thuốc theo từ khóa, kho và chip
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      // Lọc theo kho xuất
      if (selectedWarehouse !== 'all' && rx.warehouseId !== selectedWarehouse) {
        return false;
      }

      // Lọc theo chip filter
      if (activeChip === 'pending' && rx.status !== 'pending') return false;
      if (activeChip === 'dispensed' && rx.status !== 'dispensed') return false;
      if (activeChip === 'outpatient' && rx.patientType !== 'outpatient') return false;
      if (activeChip === 'inpatient' && rx.patientType !== 'inpatient') return false;
      if (activeChip === 'allergy' && !rx.hasAllergyWarning) return false;

      // Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesId = rx.id.toLowerCase().includes(q) || `rx-2026-${rx.id}`.includes(q);
        const matchesPatient = rx.patientName.toLowerCase().includes(q) || rx.patientId.toLowerCase().includes(q);
        const matchesDoctor = rx.doctorName.toLowerCase().includes(q);
        return matchesId || matchesPatient || matchesDoctor;
      }

      return true;
    });
  }, [prescriptions, selectedWarehouse, activeChip, searchQuery]);

  // Đơn thuốc đang được chọn chi tiết
  const selectedRx = useMemo(() => {
    return prescriptions.find((p) => p.id === selectedPrescriptionId) || prescriptions[0];
  }, [prescriptions, selectedPrescriptionId]);

  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className={styles.screenHeader}>
        <div>
          <h2 className={styles.screenTitle}>Cấp phát thuốc theo đơn</h2>
          <p className={styles.screenSubtitle}>
            Danh sách đơn thuốc điện tử đã ký bác sĩ chờ phát — Ca trực 20/07/2026
          </p>
        </div>
        <div className={styles.screenActions}>
          <select
            className={styles.selectField}
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            aria-label="Chọn kho xuất"
          >
            <option value="all">Tất cả kho xuất</option>
            <option value="kho-a">Kho Ngoại Trú A</option>
            <option value="kho-b">Kho Nội Trú B</option>
          </select>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
            onClick={onReloadQueue}
            aria-label="Tải danh sách đơn thuốc mới"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1,4 1,10 7,10" />
              <polyline points="23,20 23,14 17,14" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
            Tải đơn mới
          </button>
        </div>
      </div>

      {/* Queue Table Card */}
      <div className={styles.card}>
        <div className="p-4 px-6 border-b border-[#e4e9ed]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className={styles.searchInputWrap} style={{ maxWidth: '360px' }}>
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707882]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo Mã đơn, Mã BN, Họ tên, Bác sĩ..."
                aria-label="Tìm kiếm đơn thuốc"
              />
            </div>

            <div className={styles.chipBar}>
              <button
                type="button"
                className={`${styles.chip} ${activeChip === 'pending' ? styles.chipActive : ''}`}
                onClick={() => setActiveChip('pending')}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#a05c00]" />
                Chờ cấp phát ({prescriptions.filter((r) => r.status === 'pending').length})
              </button>
              <button
                type="button"
                className={`${styles.chip} ${activeChip === 'dispensed' ? styles.chipActive : ''}`}
                onClick={() => setActiveChip('dispensed')}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#1a7a4a]" />
                Đã cấp phát
              </button>
              <button
                type="button"
                className={`${styles.chip} ${activeChip === 'outpatient' ? styles.chipActive : ''}`}
                onClick={() => setActiveChip('outpatient')}
              >
                Ngoại trú
              </button>
              <button
                type="button"
                className={`${styles.chip} ${activeChip === 'inpatient' ? styles.chipActive : ''}`}
                onClick={() => setActiveChip('inpatient')}
              >
                Nội trú
              </button>
              <button
                type="button"
                className={`${styles.chip} ${activeChip === 'allergy' ? styles.chipActive : ''}`}
                onClick={() => setActiveChip('allergy')}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                Cảnh báo dị ứng
              </button>
            </div>
          </div>
        </div>

        <div className={styles.dataTableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th className={styles.th}>Mã đơn thuốc</th>
                <th className={styles.th}>Bệnh nhân &amp; BHYT</th>
                <th className={styles.th}>Khoa / Bác sĩ kê</th>
                <th className={styles.th}>Cảnh báo chuyên môn</th>
                <th className={`${styles.th} text-center`}>Trạng thái</th>
                <th className={`${styles.th} text-center`}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrescriptions.map((rx) => {
                const isSelected = selectedRx && selectedRx.id === rx.id;
                return (
                  <tr
                    key={rx.id}
                    className={`${styles.tr} ${isSelected ? 'bg-[#fff9e6]' : ''}`}
                  >
                    <td className={styles.td}>
                      <span className="font-mono font-bold text-[#006096] text-[12.5px]">
                        #RX-2026-{rx.id}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className="font-semibold text-[#171c1f]">{rx.patientName}</div>
                      <div className="text-[12px] text-[#3f4851]">
                        <span className="font-mono">{rx.patientId}</span> · {rx.patientGender} ({rx.patientAge}T)
                      </div>
                      {rx.bhytRatio && (
                        <div className="mt-0.5">
                          <span
                            className={`${styles.badge} ${
                              rx.patientType === 'outpatient' ? styles.badgeNgoaitru : styles.badgeNoitru
                            }`}
                          >
                            {rx.bhytRatio}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className={styles.td}>
                      <div className="text-[11.5px] text-[#3f4851]">{rx.department}</div>
                      <div className="font-semibold text-[#171c1f] mt-0.5">{rx.doctorName}</div>
                      <div className="mt-0.5">
                        <span className={styles.signStampBadge}>
                          「Đã ký」 {rx.doctorName.split('. ')[1] || rx.doctorName}
                        </span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      {rx.hasAllergyWarning ? (
                        <span className={`${styles.badge} ${styles.badgeWriteoff}`}>
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          {rx.allergyWarningText}
                        </span>
                      ) : (
                        <span className="text-[#3f4851]">—</span>
                      )}
                    </td>
                    <td className={`${styles.td} text-center`}>
                      {rx.status === 'pending' ? (
                        <span className={`${styles.badge} ${styles.badgePending}`}>
                          <span className={styles.badgeDot} />
                          Chờ phát
                        </span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgePaid}`}>
                          <span className={styles.badgeDot} />
                          Đã cấp phát
                        </span>
                      )}
                    </td>
                    <td className={`${styles.td} text-center`}>
                      {rx.status === 'pending' ? (
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                          onClick={() => onSelectPrescription(rx.id)}
                          aria-label={`Xử lý phát thuốc đơn ${rx.id}`}
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.5 20.4l-6.9-6.9c-2.1-2.1-2.1-5.5 0-7.6l2.1-2.1c2.1-2.1 5.5-2.1 7.6 0l6.9 6.9c2.1 2.1 2.1 5.5 0 7.6l-2.1 2.1c-2.1 2.1-5.5 2.1-7.6 0z" />
                            <path d="m8.5 8.5 7 7" />
                          </svg>
                          Xử lý phát thuốc
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                          onClick={() => onSelectPrescription(rx.id)}
                          aria-label={`Xem đơn thuốc ${rx.id}`}
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          Xem đơn
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispensing Workarea Card for Selected Rx */}
      {selectedRx && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <svg className="w-4 h-4 text-[#006096]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
              Chi tiết đơn thuốc điện tử:{' '}
              <span className="font-mono text-[#006096]">#RX-2026-{selectedRx.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={styles.signStampBadge}>
                「Đã ký」 {selectedRx.doctorName}
              </span>
              {selectedRx.status === 'pending' ? (
                <span className={`${styles.badge} ${styles.badgePending}`}>
                  <span className={styles.badgeDot} />
                  Chờ cấp phát
                </span>
              ) : (
                <span className={`${styles.badge} ${styles.badgePaid}`}>
                  <span className={styles.badgeDot} />
                  Đã cấp phát
                </span>
              )}
            </div>
          </div>

          <div className={styles.cardBody}>
            {/* Patient Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-4 mb-6 border-b border-[#e4e9ed]">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#3f4851] mb-1">
                  Bệnh nhân
                </label>
                <span className="text-[13.5px] font-semibold text-[#171c1f]">
                  {selectedRx.patientName} ({selectedRx.patientAge} tuổi · {selectedRx.patientGender})
                </span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#3f4851] mb-1">
                  Mã BN / BHYT
                </label>
                <span className="text-[13.5px] font-medium text-[#171c1f]">
                  <span className="font-mono text-[#006096]">{selectedRx.patientId}</span>
                  {selectedRx.bhytCardNumber && <> · <span className="font-mono">{selectedRx.bhytCardNumber}</span></>}
                </span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#3f4851] mb-1">
                  Chẩn đoán (ICD-10)
                </label>
                <span className="text-[13.5px] font-medium text-[#171c1f]">
                  {selectedRx.icdDiagnosis} (<span className="font-mono">{selectedRx.icdCode}</span>)
                </span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#3f4851] mb-1">
                  Bác sĩ kê đơn
                </label>
                <span className="text-[13.5px] font-medium text-[#171c1f]">
                  {selectedRx.doctorName} ({selectedRx.department})
                </span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#3f4851] mb-1">
                  Thời điểm ký đơn
                </label>
                <span className="text-[13.5px] font-mono text-[#171c1f]">{selectedRx.signedAt}</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#3f4851] mb-1">
                  Trạng thái hóa đơn
                </label>
                <span className={`${styles.badge} ${styles.badgePaid}`}>
                  Đã thanh toán viện phí ({selectedRx.invoiceId || '#INV-2026-0312'})
                </span>
              </div>
            </div>

            {/* Allergy Override Alert */}
            {selectedRx.hasAllergyWarning && (
              <div className={`${styles.alert} ${styles.alertError} mb-6`}>
                <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div>
                  <strong className="block mb-0.5">
                    CẢNH BÁO DỊ ỨNG &amp; GHI ĐÈ CHUYÊN MÔN (ALLERGY OVERRIDE):
                  </strong>
                  Bệnh nhân có tiền sử dị ứng nhóm Penicillin. Bác sĩ kê đơn đã xác nhận ghi đè (Override):{' '}
                  <em>&ldquo;{selectedRx.allergyOverrideReason}&rdquo;</em>{' '}
                  <span className="font-mono text-[12px] text-[#3f4851]">
                    ({selectedRx.allergyOverrideMeta})
                  </span>
                </div>
              </div>
            )}

            {/* Prescription Items & FEFO Allocation Table */}
            <h4 className="text-[13px] font-bold uppercase tracking-[0.5px] text-[#3f4851] mb-3">
              Danh mục thuốc kê &amp; Đề xuất trừ lô FEFO
            </h4>
            <div className={`${styles.dataTableWrap} mb-6`}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th className={styles.th}>Tên thuốc / Hoạt chất / Dạng</th>
                    <th className={`${styles.th} text-center`}>SL kê</th>
                    <th className={styles.th}>Liều dùng &amp; Hướng dẫn bác sĩ</th>
                    <th className={styles.th}>Lô xuất FEFO đề xuất</th>
                    <th className={`${styles.th} text-center`}>Hạn sử dụng</th>
                    <th className={`${styles.th} text-center`}>Kiểm tra tồn kho</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRx.items.map((item, index) => (
                    <tr key={index} className={styles.tr}>
                      <td className={styles.td}>
                        <div className="font-bold text-[13.5px] text-[#171c1f]">{item.drugName}</div>
                        <div className="text-[12px] text-[#3f4851]">{item.spec}</div>
                      </td>
                      <td className={`${styles.td} text-center`}>
                        <span className="font-mono font-bold text-[15px]">{item.quantity}</span> {item.unit}
                      </td>
                      <td className={styles.td}>
                        <span className="font-semibold text-[#171c1f]">{item.dosageInstruction}</span>
                      </td>
                      <td className={styles.td}>
                        <span className="font-mono font-bold text-[#006096]">{item.fefoLotNumber}</span>
                        <div className="text-[12px] text-[#3f4851]">
                          Vị trí: {item.shelfLocation} · Tồn:{' '}
                          <span className="font-mono">{item.availableStock.toLocaleString()}</span> {item.unit}
                        </div>
                      </td>
                      <td className={`${styles.td} text-center`}>
                        <span className="font-mono">{item.expiryDate}</span>
                      </td>
                      <td className={`${styles.td} text-center`}>
                        <span className={`${styles.badge} ${styles.badgePaid}`}>Đủ tồn FEFO</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions & 5-Right Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#e4e9ed]">
              <div className="flex items-center gap-1.5 text-[12px] text-[#004e8c]">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Quy tắc 5 đúng Dược phẩm: Đúng bệnh nhân · Đúng thuốc · Đúng liều · Đúng đường dùng · Đúng thời gian
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnErrorOutline}`}
                  onClick={() => onOpenRejectModal(selectedRx)}
                  aria-label="Từ chối hoặc trả đơn thuốc cho bác sĩ"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  Từ chối / Trả đơn
                </button>

                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={() => onPrintLabel(selectedRx)}
                  aria-label="In nhãn hướng dẫn dùng thuốc"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 6,2 18,2 18,9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  In nhãn hướng dẫn
                </button>

                {selectedRx.status === 'pending' ? (
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
                    onClick={() => onOpenDispenseModal(selectedRx)}
                    aria-label="Xác nhận cấp phát thuốc và trừ kho FEFO"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Xác nhận cấp phát &amp; Trừ kho FEFO
                  </button>
                ) : (
                  <span className={`${styles.badge} ${styles.badgePaid} p-3 text-[13px]`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Đơn đã hoàn thành cấp phát
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
