/**
 * @file PrescriptionDispenseScreen.tsx
 * @description Màn hình 1: Cấp phát thuốc theo đơn và hiển thị phân bổ trừ kho FEFO.
 */

'use client';

import React, { useMemo, useState } from 'react';
import type { Prescription } from '../types/pharmacy.types';
import type { PharmacyWarehouse } from '../types/pharmacy-inventory.schema';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

/**
 * Hợp đồng dữ liệu và callback của màn hình hàng chờ cấp phát.
 * Danh sách đơn, kho và trạng thái mutation do workspace cha cung cấp; màn hình chỉ lọc/hiển thị
 * và phát tín hiệu cho cha mở modal, refetch, in nhãn hoặc kết xuất/tải XML.
 */
interface PrescriptionDispenseScreenProps {
  /** Danh sách các đơn thuốc điện tử */
  prescriptions: Prescription[];
  /** ID của đơn thuốc đang được chọn chi tiết */
  selectedPrescriptionId: string;
  /** Callback khi chọn một đơn thuốc trong hàng chờ */
  onSelectPrescription: (id: string) => void;
  /** Callback khi người dùng nhấn nút Tải đơn mới */
  onReloadQueue: () => void;
  /** Callback mở modal xác nhận phát thuốc & trừ kho FEFO */
  onOpenDispenseModal: (rx: Prescription) => void;
  /** Callback mở modal từ chối đơn thuốc về bác sĩ */
  onOpenRejectModal: (rx: Prescription) => void;
  /** Callback in nhãn hướng dẫn sử dụng thuốc */
  onPrintLabel: (rx: Prescription) => void;
  /** Callback tải XML đã kết xuất; side effect tải tệp do workspace cha thực hiện. */
  onDownloadXml: (rx: Prescription) => void;
  /** Callback kết xuất XML; mutation và xử lý lỗi/refresh do workspace cha thực hiện. */
  onExportXml: (rx: Prescription) => void;
  /** Trạng thái đang tải XML, mặc định `false`; dùng để khóa nút tải. */
  isDownloadingXml?: boolean;
  /** Trạng thái mutation kết xuất XML, mặc định `false`; dùng để khóa nút kết xuất. */
  isExportingXml?: boolean;
  /** Trạng thái query hàng chờ, mặc định `false`; dùng cho loading state của bảng. */
  isLoading?: boolean;
  /** Từ khóa tìm kiếm được kiểm soát bởi cha; nếu thiếu thì dùng state cục bộ. */
  searchQuery?: string;
  /** Cập nhật từ khóa controlled; bỏ qua callback để dùng state cục bộ khi không truyền. */
  onSearchQueryChange?: (value: string) => void;
  /** ID kho xuất hiện tại; `'all'` nghĩa là không giới hạn kho. */
  selectedWarehouseId: string;
  /** Danh sách kho lấy từ query hoặc fallback do workspace cha chuẩn bị. */
  warehouses: PharmacyWarehouse[];
  /** Cập nhật bộ lọc kho, không tự thực hiện mutation tồn kho. */
  onSelectWarehouse: (warehouseId: string) => void;
}

/** Bộ lọc hiển thị; không thay thế các gate signed/paid/stock do backend quyết định. */
export type PrescriptionChipFilter = 'pending' | 'dispensed' | 'outpatient' | 'inpatient' | 'allergy' | 'all';

interface FilterPrescriptionOptions {
  activeChip: PrescriptionChipFilter;
  prescriptions: Prescription[];
  searchQuery: string;
  selectedWarehouseId: string;
}

interface PendingPrescriptionActionHandlers {
  onOpenDispenseModal: (rx: Prescription) => void;
  onSelectPrescription: (id: string) => void;
}

/**
 * Lọc danh sách đơn thuốc theo kho, trạng thái và từ khóa tìm kiếm của màn cấp phát.
 *
 * @param options Tập tham số lọc từ UI hiện tại; kho `'all'` bỏ qua điều kiện kho.
 * @returns Danh sách đơn thuốc phù hợp với bộ lọc, không làm thay đổi input.
 */
export function filterPrescriptionsByDispenseView({
  activeChip,
  prescriptions,
  searchQuery,
  selectedWarehouseId,
}: FilterPrescriptionOptions): Prescription[] {
  return prescriptions.filter((rx) => {
    if (selectedWarehouseId !== 'all' && rx.warehouseId !== selectedWarehouseId) {
      return false;
    }

    if (activeChip === 'pending' && rx.status !== 'pending') return false;
    if (activeChip === 'dispensed' && rx.status !== 'dispensed') return false;
    if (activeChip === 'outpatient' && rx.patientType !== 'outpatient') return false;
    if (activeChip === 'inpatient' && rx.patientType !== 'inpatient') return false;
    if (activeChip === 'allergy' && !rx.hasAllergyWarning) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchesId = rx.id.toLowerCase().includes(q) || `rx-2026-${rx.id}`.includes(q);
      const matchesPatient = rx.patientName.toLowerCase().includes(q) || rx.patientId.toLowerCase().includes(q);
      const matchesDoctor = rx.doctorName.toLowerCase().includes(q);
      return matchesId || matchesPatient || matchesDoctor;
    }

    return true;
  });
}

/**
 * Chọn đơn thuốc hiện tại; nếu ID không còn trong hàng chờ thì fallback về đơn đầu tiên.
 *
 * @param prescriptions Danh sách đơn thuốc đang có trên UI.
 * @param selectedPrescriptionId ID đơn thuốc đang được chọn.
 * @returns Đơn thuốc dùng để hiển thị chi tiết hoặc `undefined` khi danh sách rỗng.
 */
export function resolveSelectedPrescription(
  prescriptions: Prescription[],
  selectedPrescriptionId: string,
): Prescription | undefined {
  return prescriptions.find((p) => p.id === selectedPrescriptionId) || prescriptions[0];
}

/**
 * Xử lý nút "Xử lý phát thuốc": chọn dòng hiện tại và mở modal xác nhận phát thuốc.
 *
 * @param rx Đơn thuốc người dùng vừa bấm xử lý.
 * @param handlers Callback điều phối state chọn đơn và modal của workspace Dược.
 */
export function openPendingPrescriptionDispense(
  rx: Prescription,
  handlers: PendingPrescriptionActionHandlers,
): void {
  handlers.onSelectPrescription(rx.id);
  handlers.onOpenDispenseModal(rx);
}

/**
 * Màn hình Cấp phát thuốc theo đơn (Screen 1):
 * Cho phép Dược sĩ duyệt đơn thuốc điện tử đã ký bác sĩ, kiểm tra tiền sử dị ứng,
 * lọc theo kho xuất / trạng thái / loại bệnh nhân, và xử lý trừ tồn kho theo nguyên tắc FEFO.
 *
 * @param prescriptions Danh sách các đơn thuốc điện tử trong hàng chờ
 * @param selectedPrescriptionId Mã đơn thuốc đang mở xem chi tiết
 * @param onSelectPrescription Callback chọn đơn thuốc xem chi tiết
 * @param onReloadQueue Callback làm mới danh sách đơn
 * @param onOpenDispenseModal Callback mở modal xác nhận phát thuốc
 * @param onOpenRejectModal Callback mở modal từ chối đơn
 * @param onPrintLabel Callback in nhãn hướng dẫn sử dụng thuốc
 * @param onDownloadXml Callback tải XML đã kết xuất
 * @param onExportXml Callback kết xuất XML
 * @param isLoading Trạng thái loading của query hàng chờ, mặc định `false`
 * @param searchQuery Từ khóa controlled tùy chọn; state cục bộ được dùng khi không truyền
 * @param selectedWarehouseId ID kho xuất hoặc `'all'`
 * @param warehouses Danh sách kho để chọn
 * @param onSelectWarehouse Callback đổi bộ lọc kho
 * @returns Component React màn hình Cấp phát thuốc theo đơn
 * @remarks Loading, empty và trạng thái đã/đang chờ được render tại màn hình; lỗi mutation,
 * refetch và authorization được workspace cha/backend xử lý. Màn hình chỉ hiển thị cảnh báo dị
 * ứng, phân bổ FEFO và các guard UI trước khi mở modal xác nhận, không tự trừ kho.
 */
export const PrescriptionDispenseScreen: React.FC<PrescriptionDispenseScreenProps> = ({
  prescriptions,
  selectedPrescriptionId,
  onSelectPrescription,
  onReloadQueue,
  onOpenDispenseModal,
  onOpenRejectModal,
  onPrintLabel,
  onDownloadXml,
  onExportXml,
  isDownloadingXml = false,
  isExportingXml = false,
  isLoading = false,
  searchQuery: controlledSearchQuery,
  onSearchQueryChange,
  selectedWarehouseId,
  warehouses,
  onSelectWarehouse,
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState<string>('');
  const [activeChip, setActiveChip] = useState<PrescriptionChipFilter>('pending');
  const searchQuery = controlledSearchQuery ?? localSearchQuery;

  // Memo hóa bộ lọc dẫn xuất để đổi input không làm thay đổi danh sách nguồn từ server.
  const filteredPrescriptions = useMemo(() => {
    return filterPrescriptionsByDispenseView({
      activeChip,
      prescriptions,
      searchQuery: searchQuery ?? localSearchQuery,
      selectedWarehouseId,
    });
  }, [prescriptions, selectedWarehouseId, activeChip, searchQuery, localSearchQuery]);

  // Giữ fallback về đơn đầu tiên để khu vực chi tiết không mất dữ liệu khi hàng chờ refetch.
  const selectedRx = useMemo(() => {
    return resolveSelectedPrescription(prescriptions, selectedPrescriptionId);
  }, [prescriptions, selectedPrescriptionId]);

  return (
    <div className="space-y-6">
      {/* Tiêu đề và các thao tác chung của hàng chờ. */}
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
            value={selectedWarehouseId}
            onChange={(e) => onSelectWarehouse(e.target.value)}
            aria-label="Chọn kho xuất"
          >
            <option value="all">Tất cả kho xuất</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                {warehouse.name}
              </option>
            ))}
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

      {/* Bảng hàng chờ với loading và empty state rõ ràng. */}
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
                maxLength={100}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 100);
                  onSearchQueryChange?.(value);
                  if (!onSearchQueryChange) setLocalSearchQuery(value);
                }}
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
              {isLoading && (
                <tr>
                  <td className={`${styles.td} text-center text-[#3f4851]`} colSpan={6}>
                    Đang tải hàng chờ cấp phát...
                  </td>
                </tr>
              )}
              {!isLoading && filteredPrescriptions.length === 0 && (
                <tr>
                  <td className={`${styles.td} text-center text-[#3f4851]`} colSpan={6}>
                    Không có đơn thuốc phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
              {!isLoading && filteredPrescriptions.map((rx) => {
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
                          onClick={() => openPendingPrescriptionDispense(rx, {
                            onOpenDispenseModal,
                            onSelectPrescription,
                          })}
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

      {/* Khu vực xử lý chi tiết của đơn đang chọn. */}
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
            {/* Tóm tắt bệnh nhân, chẩn đoán, người kê và trạng thái hóa đơn. */}
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
                <span className={`${styles.badge} ${selectedRx.invoiceStatus === 'paid' ? styles.badgePaid : styles.badgePending}`}>
                  {selectedRx.invoiceStatus === 'paid'
                    ? `Đã thanh toán viện phí (${selectedRx.invoiceId ?? 'chưa có mã'})`
                    : 'Chưa thanh toán viện phí'}
                </span>
              </div>
            </div>

            {/* Cảnh báo dị ứng và bằng chứng ghi đè chuyên môn từ snapshot đơn thuốc. */}
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

            {/* Chi tiết thuốc và phân bổ lô FEFO do backend cung cấp. */}
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
                        {item.fefoAllocations && item.fefoAllocations.length > 1 && (
                          <div className="mt-1 space-y-0.5 text-[11.5px] text-[#3f4851]">
                            {item.fefoAllocations.map((allocation) => (
                              <div key={`${item.drugId}-${allocation.batchNumber}`}>
                                <span className="font-mono font-semibold text-[#006096]">
                                  {allocation.batchNumber}
                                </span>{' '}
                                - {allocation.quantityAllocated} {item.unit} từ {allocation.warehouseName}
                              </div>
                            ))}
                          </div>
                        )}
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

            {/* Các thao tác cuối màn hình và nhắc lại quy tắc an toàn cấp phát. */}
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
                  disabled={selectedRx.status !== 'pending'}
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

                {!selectedRx.xmlExportedAt ? (
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost}`}
                    disabled={isExportingXml}
                    onClick={() => onExportXml(selectedRx)}
                    aria-label="Kết xuất XML đơn thuốc"
                  >
                    {isExportingXml ? 'Đang kết xuất XML...' : 'Kết xuất XML'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost}`}
                    disabled={isDownloadingXml}
                    onClick={() => onDownloadXml(selectedRx)}
                    aria-label="Tải XML đơn thuốc đã kết xuất"
                  >
                    {isDownloadingXml ? 'Đang tải XML...' : 'Tải XML'}
                  </button>
                )}

                {selectedRx.status === 'pending' ? (
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
                    disabled={selectedRx.status !== 'pending' || selectedRx.invoiceStatus !== 'paid' || selectedRx.items.some((item) => !item.isStockSufficient)}
                    title={selectedRx.status !== 'pending'
                      ? 'Đơn thuốc không còn ở trạng thái chờ cấp phát.'
                      : selectedRx.invoiceStatus !== 'paid'
                        ? 'Bệnh nhân chưa thanh toán viện phí.'
                        : undefined}
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
