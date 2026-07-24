/**
 * @file PharmacyInventoryScreen.tsx
 * @description Màn hình 2: Quản lý kho thuốc & Định cấp hạn dùng FEFO
 * @author Senior Frontend Engineer
 */

'use client';

import React, { useMemo, useState } from 'react';
import type { InventoryItem, PharmacyKpiSummary, PharmacyScreen } from '../types/pharmacy.types';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

interface PharmacyInventoryScreenProps {
  inventoryItems: InventoryItem[];
  kpi: PharmacyKpiSummary;
  onNavigateToStockImport: () => void;
}

type CategoryChip = 'all' | 'topical' | 'antibiotic' | 'antihistamine' | 'special';

export const PharmacyInventoryScreen: React.FC<PharmacyInventoryScreenProps> = ({
  inventoryItems,
  kpi,
  onNavigateToStockImport,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<CategoryChip>('all');

  // Filter inventory logic
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.registrationNumber.toLowerCase().includes(q) ||
          item.lotNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inventoryItems, activeCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className={styles.screenHeader}>
        <div>
          <h2 className={styles.screenTitle}>Quản lý kho thuốc &amp; Hạn dùng FEFO</h2>
          <p className={styles.screenSubtitle}>
            Theo dõi tồn kho thực tế, số lô sản xuất và nguyên tắc xuất kho FEFO (First Expired, First Out)
          </p>
        </div>
        <div className={styles.screenActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
            onClick={onNavigateToStockImport}
            aria-label="Chuyển sang màn hình nhập kho thuốc mới"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nhập kho lô mới
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        {/* Card 1 */}
        <div className={`${styles.kpiCard} border-t-4 border-t-[#006096]`}>
          <div className={styles.kpiLabel}>Tổng danh mục thuốc</div>
          <div className={`${styles.kpiValue} text-[#006096]`}>
            <span className="font-mono">{kpi.totalDrugs}</span> mặt hàng
          </div>
          <div className="text-[11.5px] text-[#3f4851]">
            Kho Ngoại trú: <span className="font-mono">{kpi.outpatientCount}</span> · Kho Nội trú:{' '}
            <span className="font-mono">{kpi.inpatientCount}</span>
          </div>
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#006096]/10">
            <svg className="w-5 h-5 fill-[#006096]" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
            </svg>
          </div>
        </div>

        {/* Card 2 */}
        <div className={`${styles.kpiCard} border-t-4 border-t-[#a05c00]`}>
          <div className={styles.kpiLabel}>Lô cận hạn (≤ 90 ngày)</div>
          <div className={`${styles.kpiValue} text-[#a05c00]`}>
            <span className="font-mono">{kpi.nearExpiryLotsCount}</span> lô thuốc
          </div>
          <div className="text-[11.5px] text-[#3f4851]">Cần ưu tiên xuất FEFO ngay</div>
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#a05c00]/10">
            <svg className="w-5 h-5 fill-[#a05c00]" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
          </div>
        </div>

        {/* Card 3 */}
        <div className={`${styles.kpiCard} border-t-4 border-t-[#ba1a1a]`}>
          <div className={styles.kpiLabel}>Tồn kho dưới tối thiểu</div>
          <div className={`${styles.kpiValue} text-[#ba1a1a]`}>
            <span className="font-mono">{kpi.lowStockItemsCount}</span> mặt hàng
          </div>
          <div className="text-[11.5px] text-[#3f4851]">Cần lập dự trù nhập bổ sung</div>
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#ba1a1a]/10">
            <svg className="w-5 h-5 fill-[#ba1a1a]" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
        </div>

        {/* Card 4 */}
        <div className={`${styles.kpiCard} border-t-4 border-t-[#006673]`}>
          <div className={styles.kpiLabel}>Tổng giá trị tồn kho</div>
          <div className={`${styles.kpiValue} text-[#006673]`}>
            <span className="font-mono">{kpi.totalInventoryValueVnd.toLocaleString()}</span> đ
          </div>
          <div className="text-[11.5px] text-[#3f4851]">Cập nhật theo thời gian thực</div>
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#006673]/10">
            <svg className="w-5 h-5 fill-[#006673]" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Inventory Table Card */}
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
                placeholder="Tìm theo Mã thuốc, Tên thuốc, SDK, Số lô..."
                aria-label="Tìm kiếm thuốc trong kho"
              />
            </div>

            <div className={styles.chipBar}>
              <button
                type="button"
                className={`${styles.chip} ${activeCategory === 'all' ? styles.chipActive : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                Tất cả
              </button>
              <button
                type="button"
                className={`${styles.chip} ${activeCategory === 'topical' ? styles.chipActive : ''}`}
                onClick={() => setActiveCategory('topical')}
              >
                Thuốc bôi da liễu
              </button>
              <button
                type="button"
                className={`${styles.chip} ${activeCategory === 'antibiotic' ? styles.chipActive : ''}`}
                onClick={() => setActiveCategory('antibiotic')}
              >
                Kháng sinh
              </button>
              <button
                type="button"
                className={`${styles.chip} ${activeCategory === 'antihistamine' ? styles.chipActive : ''}`}
                onClick={() => setActiveCategory('antihistamine')}
              >
                Kháng histamin
              </button>
              <button
                type="button"
                className={`${styles.chip} ${activeCategory === 'special' ? styles.chipActive : ''}`}
                onClick={() => setActiveCategory('special')}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                Thuốc kiểm soát đặc biệt
              </button>
            </div>
          </div>
        </div>

        <div className={styles.dataTableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th className={styles.th}>Mã thuốc</th>
                <th className={styles.th}>Tên thuốc / Hoạt chất</th>
                <th className={styles.th}>Số đăng ký (SDK)</th>
                <th className={styles.th}>Số lô (Batch)</th>
                <th className={`${styles.th} text-center`}>Hạn sử dụng</th>
                <th className={`${styles.th} text-center`}>Định cấp FEFO</th>
                <th className={`${styles.th} text-right`}>Tồn kho hiện tại</th>
                <th className={`${styles.th} text-right`}>Tồn tối thiểu</th>
                <th className={`${styles.th} text-center`}>Vị trí kệ kho</th>
                <th className={`${styles.th} text-center`}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                let rowBgClass = '';
                if (item.status === 'Cảnh báo cận hạn') rowBgClass = 'bg-[#fff4e5]';
                if (item.status === 'Tồn dưới tối thiểu') rowBgClass = 'bg-[#ffebee]';

                return (
                  <tr key={item.id} className={`${styles.tr} ${rowBgClass}`}>
                    <td className={styles.td}>
                      <span className="font-mono text-[#006096]">{item.code}</span>
                    </td>
                    <td className={styles.td}>
                      <div
                        className={`font-semibold ${
                          item.category === 'special' ? 'text-[#ba1a1a]' : 'text-[#171c1f]'
                        }`}
                      >
                        {item.name}
                      </div>
                      <div className="text-[12px] text-[#3f4851]">{item.spec}</div>
                    </td>
                    <td className={styles.td}>
                      <span className="font-mono">{item.registrationNumber}</span>
                    </td>
                    <td className={styles.td}>
                      <span
                        className={`font-mono font-bold ${
                          item.status === 'Cảnh báo cận hạn' ? 'text-[#a05c00]' : 'text-[#171c1f]'
                        }`}
                      >
                        {item.lotNumber}
                      </span>
                    </td>
                    <td className={`${styles.td} text-center`}>
                      <span
                        className={`font-mono ${
                          item.status === 'Cảnh báo cận hạn' ? 'font-bold text-[#a05c00]' : ''
                        }`}
                      >
                        {item.expiryDate}
                      </span>
                    </td>
                    <td className={`${styles.td} text-center`}>
                      {item.fefoPriority === 'FEFO Ưu tiên' && (
                        <span className={`${styles.badge} ${styles.badgePaid}`}>FEFO Ưu tiên</span>
                      )}
                      {item.fefoPriority === 'Cận hạn' && (
                        <span className={`${styles.badge} ${styles.badgePending}`}>
                          <svg
                            className="w-3 h-3 mr-0.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          Cận hạn ≤ 60 ngày
                        </span>
                      )}
                      {item.fefoPriority === 'Tủ két sắt' && (
                        <span className={`${styles.badge} ${styles.badgeWriteoff}`}>Tủ két sắt</span>
                      )}
                    </td>
                    <td className={`${styles.td} text-right`}>
                      <span
                        className={`font-mono font-bold ${
                          item.status === 'Tồn dưới tối thiểu' ? 'text-[#ba1a1a]' : ''
                        }`}
                      >
                        {item.currentStock.toLocaleString()}
                      </span>{' '}
                      {item.unit}
                    </td>
                    <td className={`${styles.td} text-right`}>
                      <span className="font-mono text-[#3f4851]">{item.minStock}</span> {item.unit}
                    </td>
                    <td className={`${styles.td} text-center`}>
                      <span
                        className={`font-mono ${
                          item.category === 'special' ? 'font-bold text-[#ba1a1a]' : ''
                        }`}
                      >
                        {item.shelfLocation}
                      </span>
                    </td>
                    <td className={`${styles.td} text-center`}>
                      {item.status === 'Đạt chuẩn' && (
                        <span className={`${styles.badge} ${styles.badgePaid}`}>Đạt chuẩn</span>
                      )}
                      {item.status === 'Cảnh báo cận hạn' && (
                        <span className={`${styles.badge} ${styles.badgePending}`}>Cảnh báo cận hạn</span>
                      )}
                      {item.status === 'Tồn dưới tối thiểu' && (
                        <span className={`${styles.badge} ${styles.badgeWriteoff}`}>
                          <svg
                            className="w-3 h-3 mr-0.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          Tồn dưới tối thiểu
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-[#e4e9ed] text-[12.5px] text-[#3f4851]">
          <span>
            Hiển thị <strong>{filteredItems.length} / {kpi.totalDrugs}</strong> mặt hàng thuốc
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              className="min-h-[40px] min-w-[40px] px-3.5 rounded-lg border border-[#bfc7d2] bg-transparent text-[12.5px] text-[#3f4851] hover:border-[#006096] hover:text-[#006096] transition-colors"
            >
              ← Trước
            </button>
            <button
              type="button"
              className="min-h-[40px] min-w-[40px] px-3.5 rounded-lg border border-[#006096] bg-[#006096] text-white text-[12.5px]"
            >
              1
            </button>
            <button
              type="button"
              className="min-h-[40px] min-w-[40px] px-3.5 rounded-lg border border-[#bfc7d2] bg-transparent text-[12.5px] text-[#3f4851] hover:border-[#006096] hover:text-[#006096] transition-colors"
            >
              Tiếp →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
