/**
 * @file StockReportScreen.tsx
 * @description Báo cáo movement immutable từ API kho dược.
 */

'use client';

import React from 'react';

import type {
  PharmacyStockMovement,
  StockMovementType,
} from '../types/pharmacy-inventory.schema';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

interface StockReportScreenProps {
  logs: PharmacyStockMovement[];
  from: string;
  to: string;
  movementType: StockMovementType | '';
  isLoading?: boolean;
  isError?: boolean;
  dateError?: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onMovementTypeChange: (value: StockMovementType | '') => void;
  onExportExcel: () => void;
}

const movementLabels: Record<StockMovementType, string> = {
  adjustment: 'Điều chỉnh',
  prescription_cancel: 'Hoàn đơn',
  prescription_sign: 'Xuất theo đơn',
  receipt: 'Nhập kho',
};

/** Hiển thị giá trị movement có dấu, để người dùng phân biệt xuất và nhập kho. */
function formatQuantity(value: number): string {
  return value > 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
}

export const StockReportScreen: React.FC<StockReportScreenProps> = ({
  logs,
  from,
  to,
  movementType,
  isLoading = false,
  isError = false,
  dateError,
  onFromChange,
  onToChange,
  onMovementTypeChange,
  onExportExcel,
}) => (
  <div className="space-y-6">
    <div className={styles.screenHeader}>
      <div>
        <h2 className={styles.screenTitle}>Báo cáo biến động kho</h2>
        <p className={styles.screenSubtitle}>Nhật ký immutable phục vụ đối soát và audit dược.</p>
      </div>
      <button
        type="button"
        className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
        onClick={onExportExcel}
        aria-label="Xuất báo cáo biến động kho ra Excel"
      >
        Xuất báo cáo kho (Excel)
      </button>
    </div>

    <div className={`${styles.card} flex flex-wrap items-end gap-3 p-4`}>
      <label className="text-sm font-semibold">
        Từ ngày
        <input className={`${styles.formControl} mt-1`} type="date" value={from} onChange={(event) => onFromChange(event.target.value)} />
      </label>
      <label className="text-sm font-semibold">
        Đến ngày
        <input className={`${styles.formControl} mt-1`} type="date" value={to} onChange={(event) => onToChange(event.target.value)} />
      </label>
      <label className="text-sm font-semibold">
        Loại biến động
        <select
          className={`${styles.formControl} mt-1`}
          value={movementType}
          onChange={(event) => onMovementTypeChange(event.target.value as StockMovementType | '')}
        >
          <option value="">Tất cả</option>
          {Object.entries(movementLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      {dateError && <p className="text-sm font-semibold text-[#ba1a1a]" role="alert">{dateError}</p>}
    </div>

    <div className={styles.card}>
      {isLoading && <p className="p-6 text-sm text-[#3f4851]">Đang tải biến động kho...</p>}
      {isError && !isLoading && <p className="p-6 text-sm font-semibold text-[#ba1a1a]">Không tải được báo cáo kho.</p>}
      {!isLoading && !isError && logs.length === 0 && <p className="p-6 text-sm text-[#3f4851]">Không có biến động phù hợp.</p>}
      {!isLoading && !isError && logs.length > 0 && (
        <div className={styles.dataTableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th className={styles.th}>Mã GD</th>
                <th className={styles.th}>Thuốc / Lô</th>
                <th className={styles.th}>Loại biến động</th>
                <th className={`${styles.th} text-right`}>Số lượng</th>
                <th className={`${styles.th} text-right`}>Tồn sau GD</th>
                <th className={styles.th}>Người thực hiện</th>
                <th className={styles.th}>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.movementId} className={styles.tr}>
                  <td className={`${styles.td} font-mono text-[#006096]`}>{log.movementId}</td>
                  <td className={styles.td}>
                    <div className="font-semibold">{log.medicine.name}</div>
                    <div className="text-[12px] text-[#3f4851]">{log.batch.batchNumber}</div>
                  </td>
                  <td className={styles.td}>{movementLabels[log.movementType]}</td>
                  <td className={`${styles.td} text-right font-mono font-bold ${log.quantityChange < 0 ? 'text-[#ba1a1a]' : 'text-[#1a7a4a]'}`}>
                    {formatQuantity(log.quantityChange)}
                  </td>
                  <td className={`${styles.td} text-right font-mono`}>{log.balanceAfter.toLocaleString()}</td>
                  <td className={styles.td}>{log.actorUserId ?? 'Hệ thống'}</td>
                  <td className={`${styles.td} font-mono text-[12px]`}>{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);
