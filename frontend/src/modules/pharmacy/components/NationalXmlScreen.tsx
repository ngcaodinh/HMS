/**
 * @file NationalXmlScreen.tsx
 * @description Màn hình 4: Tra cứu đơn thuốc & XML Đơn thuốc Quốc gia (Thông tư 26/BYT)
 * @author Senior Frontend Engineer
 */

'use client';

import React from 'react';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

interface NationalXmlScreenProps {
  xmlContent: string;
  onDownloadXml: () => void;
}

export const NationalXmlScreen: React.FC<NationalXmlScreenProps> = ({
  xmlContent,
  onDownloadXml,
}) => {
  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className={styles.screenHeader}>
        <div>
          <h2 className={styles.screenTitle}>Tra cứu đơn thuốc &amp; XML Đơn thuốc Quốc gia</h2>
          <p className={styles.screenSubtitle}>
            Tuân thủ Thông tư 26/2025/TT-BYT &amp; Quy chế liên thông Đơn thuốc Quốc gia QĐ 425/QĐ-BYT
          </p>
        </div>
      </div>

      {/* Compliance Info Banner */}
      <div className={`${styles.alert} ${styles.alertInfo}`}>
        <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div>
          Mọi đơn thuốc điện tử đã ký số được tự động kết xuất tệp tin XML chuẩn hóa phục vụ lưu trữ EMR,
          kiểm toán độc lập và sẵn sàng truyền nhận liên thông.
        </div>
      </div>

      {/* XML Preview Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <svg className="w-4 h-4 text-[#006096]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16,18 22,12 16,6" />
              <polyline points="8,6 2,12 8,18" />
            </svg>
            Xem tệp XML đơn thuốc điện tử:{' '}
            <span className="font-mono text-[#006096]">#RX-2026-0891.xml</span>
          </div>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
            onClick={onDownloadXml}
            aria-label="Tải xuống tệp XML đơn thuốc"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Tải tệp XML
          </button>
        </div>

        <div className={styles.cardBody}>
          <pre className="max-h-[420px] overflow-x-auto rounded-xl bg-[#1e293b] p-5 font-mono text-[12px] leading-relaxed text-[#e2e8f0] whitespace-pre">
            {xmlContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
