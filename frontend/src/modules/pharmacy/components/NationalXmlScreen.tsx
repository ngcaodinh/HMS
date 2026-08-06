/**
 * @file NationalXmlScreen.tsx
 * @description Tra cứu XML của đơn thuốc được chọn, không dùng nội dung mẫu hard-code.
 */

'use client';

import React from 'react';

import type { Prescription } from '../types/pharmacy.types';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

/**
 * Hợp đồng dữ liệu và callback của màn hình tra cứu XML quốc gia.
 * Nội dung XML và trạng thái kết xuất/tải được workspace cha lấy từ API hoặc fallback đã được
 * chuẩn hóa; component này chỉ hiển thị và phát callback thao tác.
 */
interface NationalXmlScreenProps {
  /** Đơn thuốc hiện tại; `null` được render thành empty state. */
  prescription: Prescription | null;
  /** Danh sách đơn cho bộ chọn, mặc định rỗng và không hiển thị bộ chọn khi rỗng. */
  prescriptions?: Prescription[];
  /** Nội dung XML đã tải, hoặc `null` khi đang tải/không đọc được. */
  xmlContent: string | null;
  /** Trạng thái đang tải nội dung XML, mặc định `false`. */
  isLoading?: boolean;
  /** Trạng thái đang tải tệp, mặc định `false`; dùng để khóa nút tải. */
  isDownloading?: boolean;
  /** Trạng thái kết xuất XML, mặc định `false`; dùng để khóa nút kết xuất. */
  isExporting?: boolean;
  /** Chọn đơn tra cứu trong danh sách, tùy chọn. */
  onSelectPrescription?: (id: string) => void;
  /** Kết xuất XML cho đơn được chọn; mutation và lỗi do workspace cha xử lý. */
  onExportXml?: (prescription: Prescription) => void;
  /** Tải tệp XML đã kết xuất; side effect do workspace cha thực hiện. */
  onDownloadXml: () => void;
}

/**
 * Hiển thị XML thật của đơn đã xuất hoặc trạng thái chưa đủ điều kiện nghiệp vụ.
 *
 * @param prescription Đơn thuốc được chọn để tra cứu.
 * @param prescriptions Danh sách đơn cho bộ chọn, mặc định `[]`.
 * @param xmlContent Nội dung XML đã được workspace cha tải hoặc tạo fallback.
 * @param isLoading Trạng thái tải nội dung XML, mặc định `false`.
 * @param isDownloading Trạng thái tải tệp, mặc định `false`.
 * @param isExporting Trạng thái kết xuất, mặc định `false`.
 * @param onSelectPrescription Callback đổi đơn tra cứu.
 * @param onExportXml Callback kết xuất XML.
 * @param onDownloadXml Callback tải XML.
 * @returns Component React với empty, warning, loading, success hoặc error state.
 * @remarks Component không tự gọi API và không tự mutation. UI chỉ cho tải khi đơn đã có
 * `xmlExportedAt`; quyền truy cập và tính hợp lệ của XML vẫn do workspace/backend quyết định.
 */
export const NationalXmlScreen: React.FC<NationalXmlScreenProps> = ({
  prescription,
  prescriptions = [],
  xmlContent,
  isLoading = false,
  isDownloading = false,
  isExporting = false,
  onSelectPrescription,
  onExportXml,
  onDownloadXml,
}) => {
  const hasExportedXml = Boolean(prescription?.xmlExportedAt);

  return (
    <div className="space-y-6">
      <div className={styles.screenHeader}>
        <div>
          <h2 className={styles.screenTitle}>Tra cứu đơn thuốc &amp; XML đơn thuốc</h2>
          <p className={styles.screenSubtitle}>
            Chỉ hiển thị XML của đơn thuốc thật đã được kết xuất.
          </p>
        </div>

        {prescriptions.length > 0 && onSelectPrescription && (
          <div className="flex items-center gap-3">
            <label
              htmlFor="select-xml-prescription"
              className="text-xs font-semibold text-[#5c6470] whitespace-nowrap"
            >
              Chọn đơn tra cứu:
            </label>
            <select
              id="select-xml-prescription"
              className={`${styles.selectField} text-xs py-1.5 px-3 min-w-[280px] bg-white font-medium`}
              value={prescription?.id ?? ''}
              onChange={(e) => onSelectPrescription(e.target.value)}
            >
              {prescriptions.map((rx) => (
                <option key={rx.id} value={rx.id}>
                  {rx.prescriptionCode ?? rx.id} - {rx.patientName}{' '}
                  {rx.xmlExportedAt ? '(Đã kết xuất XML)' : '(Chưa kết xuất)'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!prescription && (
        <div className={`${styles.alert} ${styles.alertInfo}`}>Chưa có đơn thuốc được chọn.</div>
      )}
      {prescription && !hasExportedXml && (
        <div
          className={`${styles.alert} ${styles.alertWarning} flex-col sm:flex-row flex items-start sm:items-center justify-between gap-4`}
        >
          <div>
            <p className="font-semibold">
              Đơn thuốc chưa được kết xuất XML. Vào màn Cấp phát để kết xuất trước.
            </p>
            <p className="text-xs mt-1 text-[#854d0e]">
              Đơn thuốc{' '}
              <span className="font-mono font-bold">
                {prescription.prescriptionCode ?? prescription.id}
              </span>{' '}
              ({prescription.patientName}) cần được kết xuất dữ liệu XML theo chuẩn Bộ Y tế.
            </p>
          </div>
          {onExportXml && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm} whitespace-nowrap shadow-sm`}
              disabled={isExporting}
              onClick={() => onExportXml(prescription)}
            >
              {isExporting ? 'Đang kết xuất...' : 'Kết xuất XML ngay'}
            </button>
          )}
        </div>
      )}
      {prescription && hasExportedXml && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              Xem XML đơn thuốc:{' '}
              <span className="font-mono text-[#006096]">
                {prescription.prescriptionCode ?? prescription.id}
              </span>
            </div>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
              disabled={isDownloading}
              onClick={onDownloadXml}
            >
              {isDownloading ? 'Đang tải XML...' : 'Tải tệp XML'}
            </button>
          </div>
          <div className={styles.cardBody}>
            {isLoading && <p className="text-sm text-[#3f4851]">Đang tải nội dung XML...</p>}
            {!isLoading && xmlContent && (
              <pre className="max-h-[420px] overflow-x-auto rounded-xl bg-[#1e293b] p-5 font-mono text-[12px] leading-relaxed text-[#e2e8f0] whitespace-pre">
                {xmlContent}
              </pre>
            )}
            {!isLoading && !xmlContent && (
              <p className="text-sm text-[#3f4851]">
                Không đọc được nội dung XML, hãy dùng nút tải tệp để thử lại.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
