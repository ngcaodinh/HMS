/**
 * @file StockReportScreen.tsx
 * @description Màn hình 5: Báo cáo biến động kho & Nhật ký kiểm toán xuất nhập tồn
 * @author Senior Frontend Engineer
 */

'use client';

import React from 'react';
import type { StockMovementLog } from '../types/pharmacy.types';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

interface StockReportScreenProps {
  logs: StockMovementLog[];
  onExportExcel: () => void;
}

export const StockReportScreen: React.FC<StockReportScreenProps> = ({ logs, onExportExcel }) => {
  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className={styles.screenHeader}>
        <div>
          <h2 className={styles.screenTitle}>Báo cáo biến động kho</h2>
          <p className={styles.screenSubtitle}>
            Nhật ký kiểm toán biến động xuất nhập tồn thuốc ca trực 20/07/2026
          </p>
        </div>
        <div className={styles.screenActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`}
            onClick={onExportExcel}
            aria-label="Xuất báo cáo biến động kho ra Excel"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Xuất báo cáo kho (Excel)
          </button>
        </div>
      </div>

      {/* Audit Log Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <svg className="w-4 h-4 text-[#006096]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Lịch sử xuất nhập tồn thuốc gần nhất
          </div>
        </div>

        <div className={styles.dataTableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th className={styles.th}>Mã GD</th>
                <th className={styles.th}>Mã thuốc / Tên thuốc</th>
                <th className={styles.th}>Số lô (Batch)</th>
                <th className={styles.th}>Loại biến động</th>
                <th className={`${styles.th} text-center`}>Số lượng</th>
                <th className={`${styles.th} text-right`}>Tồn sau GD</th>
                <th className={styles.th}>Người thực hiện</th>
                <th className={styles.th}>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className={styles.tr}>
                  <td className={styles.td}>
                    <span className="font-mono text-[#006096] font-semibold">{log.id}</span>
                  </td>
                  <td className={styles.td}>
                    <div className="font-bold text-[#171c1f]">{log.drugName}</div>
                    <div className="text-[12px] font-mono text-[#3f4851]">{log.drugCode}</div>
                  </td>
                  <td className={styles.td}>
                    <span className="font-mono">{log.lotNumber}</span>
                  </td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.badge} ${
                        log.movementTypeBadge === 'paid'
                          ? styles.badgePaid
                          : log.movementTypeBadge === 'blue'
                          ? styles.badgeBlue
                          : styles.badgePending
                      }`}
                    >
                      {log.movementType}
                    </span>
                  </td>
                  <td className={`${styles.td} text-center`}>
                    <span
                      className={`font-mono font-bold ${
                        log.quantityChange < 0 ? 'text-[#ba1a1a]' : 'text-[#1a7a4a]'
                      }`}
                    >
                      {log.quantityChangeText}
                    </span>
                  </td>
                  <td className={`${styles.td} text-right`}>
                    <span className="font-mono font-bold">{log.postStock.toLocaleString()}</span> {log.unit}
                  </td>
                  <td className={styles.td}>
                    <span className="font-semibold text-[#171c1f]">{log.executor}</span>
                  </td>
                  <td className={styles.td}>
                    <span className="font-mono text-[12px] text-[#3f4851]">{log.timestamp}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
