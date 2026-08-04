/**
 * @file NationalXmlScreen.tsx
 * @description Tra cứu XML của đơn thuốc được chọn, không dùng nội dung mẫu hard-code.
 */

'use client';

import React from 'react';

import type { Prescription } from '../types/pharmacy.types';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

interface NationalXmlScreenProps {
  prescription: Prescription | null;
  xmlContent: string | null;
  isLoading?: boolean;
  isDownloading?: boolean;
  onDownloadXml: () => void;
}

/** Hiển thị XML thật của đơn đã xuất, hoặc empty state khi chưa đủ điều kiện nghiệp vụ. */
export const NationalXmlScreen: React.FC<NationalXmlScreenProps> = ({
  prescription,
  xmlContent,
  isLoading = false,
  isDownloading = false,
  onDownloadXml,
}) => {
  const hasExportedXml = Boolean(prescription?.xmlExportedAt);

  return (
    <div className="space-y-6">
      <div className={styles.screenHeader}>
        <div>
          <h2 className={styles.screenTitle}>Tra cứu đơn thuốc &amp; XML đơn thuốc</h2>
          <p className={styles.screenSubtitle}>Chỉ hiển thị XML của đơn thuốc thật đã được kết xuất.</p>
        </div>
      </div>

      {!prescription && <div className={`${styles.alert} ${styles.alertInfo}`}>Chưa có đơn thuốc được chọn.</div>}
      {prescription && !hasExportedXml && (
        <div className={`${styles.alert} ${styles.alertWarning}`}>
          Đơn thuốc chưa được kết xuất XML. Vào màn Cấp phát để kết xuất trước.
        </div>
      )}
      {prescription && hasExportedXml && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              Xem XML đơn thuốc: <span className="font-mono text-[#006096]">{prescription.prescriptionCode ?? prescription.id}</span>
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
              <p className="text-sm text-[#3f4851]">Không đọc được nội dung XML, hãy dùng nút tải tệp để thử lại.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
