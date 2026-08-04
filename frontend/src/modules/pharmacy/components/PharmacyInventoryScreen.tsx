/**
 * @file PharmacyInventoryScreen.tsx
 * @description Màn hình tồn kho và hạn dùng FEFO dùng dữ liệu batch thật từ API.
 */

'use client';

import React from 'react';

import type {
  PharmacyInventoryBatch,
  PharmacyInventorySummary,
} from '../types/pharmacy-inventory.schema';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

interface PharmacyInventoryScreenProps {
  inventoryItems: PharmacyInventoryBatch[];
  kpi: PharmacyInventorySummary;
  isLoading?: boolean;
  isError?: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onNavigateToStockImport: () => void;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('vi-VN');
}

/** Hiển thị trạng thái FEFO theo số ngày còn lại do backend tính từ hạn dùng. */
function getExpiryLabel(item: PharmacyInventoryBatch): string {
  if (item.isExpired) return 'Đã hết hạn';
  if (item.isExpiringSoon) return `Cận hạn (${item.daysToExpiry} ngày)`;
  return `Còn ${item.daysToExpiry} ngày`;
}

/**
 * Hiển thị tồn kho theo batch thật, giữ nguyên các field server trả về để dược sĩ
 * không ra quyết định dựa trên dữ liệu mock hoặc field suy diễn không có nguồn.
 */
export const PharmacyInventoryScreen: React.FC<PharmacyInventoryScreenProps> = ({
  inventoryItems,
  kpi,
  isLoading = false,
  isError = false,
  searchQuery,
  onSearchQueryChange,
  onNavigateToStockImport,
}) => (
  <div className="space-y-6">
    <div className={styles.screenHeader}>
      <div>
        <h2 className={styles.screenTitle}>Quản lý kho thuốc &amp; Hạn dùng FEFO</h2>
        <p className={styles.screenSubtitle}>
          Theo dõi tồn kho theo lô và ưu tiên xuất lô có hạn dùng sớm nhất.
        </p>
      </div>
      <div className={styles.screenActions}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
          onClick={onNavigateToStockImport}
        >
          Nhập kho lô mới
        </button>
      </div>
    </div>

    <div className={styles.kpiGrid}>
      <div className={`${styles.kpiCard} border-t-4 border-t-[#006096]`}>
        <div className={styles.kpiLabel}>Tổng số lô đang hoạt động</div>
        <div className={`${styles.kpiValue} text-[#006096]`}>{kpi.totalBatches}</div>
        <div className="text-[11.5px] text-[#3f4851]">Dữ liệu từ kho thực tế</div>
      </div>
      <div className={`${styles.kpiCard} border-t-4 border-t-[#006673]`}>
        <div className={styles.kpiLabel}>Tổng số lượng tồn</div>
        <div className={`${styles.kpiValue} text-[#006673]`}>{kpi.totalQuantity.toLocaleString()}</div>
        <div className="text-[11.5px] text-[#3f4851]">Tổng trên các batch</div>
      </div>
      <div className={`${styles.kpiCard} border-t-4 border-t-[#a05c00]`}>
        <div className={styles.kpiLabel}>Lô cận hạn ≤ 30 ngày</div>
        <div className={`${styles.kpiValue} text-[#a05c00]`}>{kpi.expiringSoonBatches}</div>
        <div className="text-[11.5px] text-[#3f4851]">Cần ưu tiên xuất FEFO</div>
      </div>
      <div className={`${styles.kpiCard} border-t-4 border-t-[#ba1a1a]`}>
        <div className={styles.kpiLabel}>Lô tồn dưới ngưỡng</div>
        <div className={`${styles.kpiValue} text-[#ba1a1a]`}>{kpi.lowStockBatches}</div>
        <div className="text-[11.5px] text-[#3f4851]">Ngưỡng cảnh báo: 10 đơn vị</div>
      </div>
    </div>

    <div className={styles.card}>
      <div className="border-b border-[#e4e9ed] p-4 px-6">
        <div className={styles.searchInputWrap} style={{ maxWidth: '420px' }}>
          <input
            type="text"
            className={styles.searchInput}
            value={searchQuery}
            maxLength={100}
            onChange={(event) => onSearchQueryChange(event.target.value.slice(0, 100))}
            placeholder="Tìm theo mã thuốc, tên thuốc, hoạt chất, số lô..."
            aria-label="Tìm kiếm tồn kho thuốc"
          />
        </div>
      </div>

      {isLoading && <p className="p-6 text-sm text-[#3f4851]">Đang tải tồn kho...</p>}
      {isError && !isLoading && (
        <p className="p-6 text-sm font-semibold text-[#ba1a1a]">
          Không tải được dữ liệu tồn kho, vui lòng thử lại.
        </p>
      )}
      {!isLoading && !isError && inventoryItems.length === 0 && (
        <p className="p-6 text-sm text-[#3f4851]">Không có batch phù hợp với bộ lọc hiện tại.</p>
      )}
      {!isLoading && !isError && inventoryItems.length > 0 && (
        <div className={styles.dataTableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th className={styles.th}>Thuốc</th>
                <th className={styles.th}>Số lô</th>
                <th className={`${styles.th} text-center`}>Hạn dùng</th>
                <th className={`${styles.th} text-center`}>FEFO</th>
                <th className={`${styles.th} text-right`}>Tồn kho</th>
                <th className={styles.th}>Kho</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((item) => (
                <tr key={item.batchId} className={styles.tr}>
                  <td className={styles.td}>
                    <div className="font-semibold">{item.medicine.name}</div>
                    <div className="text-[12px] text-[#3f4851]">
                      {item.medicine.code ?? item.medicine.medicineId}
                      {item.medicine.activeIngredient ? ` · ${item.medicine.activeIngredient}` : ''}
                    </div>
                  </td>
                  <td className={`${styles.td} font-mono`}>{item.batchNumber}</td>
                  <td className={`${styles.td} text-center font-mono`}>{formatDate(item.expiryDate)}</td>
                  <td className={`${styles.td} text-center`}>
                    <span className={`${styles.badge} ${item.isExpired || item.isExpiringSoon ? styles.badgePending : styles.badgePaid}`}>
                      {getExpiryLabel(item)}
                    </span>
                  </td>
                  <td className={`${styles.td} text-right font-mono font-bold`}>
                    {item.quantity.toLocaleString()} {item.medicine.unit}
                  </td>
                  <td className={styles.td}>{item.warehouse.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);
