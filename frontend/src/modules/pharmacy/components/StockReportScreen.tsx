/**
 * @file StockReportScreen.tsx
 * @description Báo cáo biến động kho immutable từ dữ liệu API kho dược.
 */

'use client';

import React from 'react';

import type {
  PharmacyStockMovement,
  StockMovementType,
} from '../types/pharmacy-inventory.schema';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

/**
 * Hợp đồng dữ liệu và callback của màn hình báo cáo biến động kho.
 * `from`/`to` dùng định dạng `YYYY-MM-DD`; `logs` là các bản ghi đã được query theo bộ lọc,
 * trong đó số lượng và tồn kho dùng cùng đơn vị thuốc với dữ liệu backend.
 */
interface StockReportScreenProps {
  /** Nhật ký biến động immutable; rỗng được render thành empty state. */
  logs: PharmacyStockMovement[];
  /** Ngày bắt đầu lọc, định dạng `YYYY-MM-DD`, có thể rỗng. */
  from: string;
  /** Ngày kết thúc lọc, định dạng `YYYY-MM-DD`, có thể rỗng. */
  to: string;
  /** Loại biến động hoặc chuỗi rỗng để chọn tất cả. */
  movementType: StockMovementType | '';
  /** Trạng thái query, mặc định `false`. */
  isLoading?: boolean;
  /** Lỗi query, mặc định `false`; error state ưu tiên hơn empty state. */
  isError?: boolean;
  /** Lỗi khoảng ngày do workspace cha kiểm tra trước khi query. */
  dateError?: string;
  /** Cập nhật ngày bắt đầu và có thể kích hoạt refetch ở workspace cha. */
  onFromChange: (value: string) => void;
  /** Cập nhật ngày kết thúc và có thể kích hoạt refetch ở workspace cha. */
  onToChange: (value: string) => void;
  /** Cập nhật loại biến động và có thể kích hoạt refetch ở workspace cha. */
  onMovementTypeChange: (value: StockMovementType | '') => void;
  /** Ủy quyền side effect xuất Excel cho workspace cha. */
  onExportExcel: () => void;
}

/** Nhãn hiển thị cho các trạng thái biến động mà API kho trả về. */
const movementLabels: Record<StockMovementType, string> = {
  adjustment: 'Điều chỉnh',
  prescription_cancel: 'Hoàn đơn',
  prescription_sign: 'Xuất theo đơn',
  receipt: 'Nhập kho',
};

/** Hiển thị số lượng biến động có dấu; đơn vị giữ nguyên theo `quantityChange` của API. */
function formatQuantity(value: number): string {
  return value > 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
}

/**
 * Hiển thị báo cáo biến động kho phục vụ đối soát và audit Dược.
 *
 * @param logs Nhật ký immutable đã được lọc từ API.
 * @param from Ngày bắt đầu dạng `YYYY-MM-DD`.
 * @param to Ngày kết thúc dạng `YYYY-MM-DD`.
 * @param movementType Loại biến động hoặc rỗng để chọn tất cả.
 * @param isLoading Trạng thái query, mặc định `false`.
 * @param isError Trạng thái lỗi query, mặc định `false`.
 * @param dateError Lỗi khoảng ngày nếu bộ lọc không hợp lệ.
 * @param onExportExcel Callback xuất báo cáo do workspace cha cung cấp.
 * @returns Component React với loading, error, empty hoặc bảng dữ liệu.
 * @remarks Màn hình chỉ đọc và không tự mutation; query, refetch, quyền truy cập và cơ chế xuất
 * tệp do lớp cha/backend quyết định. Khi có `isError`, error state được hiển thị thay cho empty.
 */
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
