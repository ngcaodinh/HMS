/** Thanh tiêu đề của phân hệ Dược sĩ và Nhà thuốc, chỉ trình bày callback từ workspace. */

'use client';

import React from 'react';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

interface PharmacyTopHeaderProps {
  /** Callback yêu cầu parent mở luồng đồng bộ/đối soát FEFO. */
  onSyncFefo: () => void;
  /** Callback yêu cầu parent mở danh sách thông báo. */
  onShowNotifications: () => void;
}

/**
 * Hiển thị thanh Top Header phía trên phân hệ Dược sĩ & Nhà thuốc.
 * Bao gồm tên phân hệ, thông tin ca trực, huy hiệu bệnh viện và nút chức năng nhanh.
 *
 * @param onSyncFefo Callback yêu cầu parent mở luồng đồng bộ tồn kho FEFO.
 * @param onShowNotifications Callback yêu cầu parent mở danh sách thông báo.
 * @returns Thanh tiêu đề với các callback do parent điều phối.
 * @remarks Đây là component trình bày, không tự fetch hoặc cập nhật tồn kho. Callback chỉ chuyển sự
 * kiện cho parent; backend vẫn là authority cho FEFO, stock movement, quyền và các command nhạy cảm.
 * Component không có loading/error/empty state riêng.
 */
export const PharmacyTopHeader: React.FC<PharmacyTopHeaderProps> = ({
  onSyncFefo,
  onShowNotifications,
}) => {
  return (
    <header className={styles.topHeader}>
      <div>
        <h1 className={styles.topHeaderTitle}>Phân hệ Quản lý Dược &amp; Nhà thuốc</h1>
        <p className={styles.topHeaderSub}>Thứ Hai, 20/07/2026 · Ca trực Kho Dược từ 07:00</p>
      </div>

      <div className="flex items-center gap-2">
        <div className={styles.hospitalBadge}>
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          Bệnh viện Da Liễu HMS-VN
        </div>

        <button
          type="button"
          className={styles.headerBtn}
          onClick={onSyncFefo}
          title="Đồng bộ FEFO"
          aria-label="Đồng bộ tồn kho FEFO"
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1,4 1,10 7,10" />
            <polyline points="23,20 23,14 17,14" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
        </button>

        <button
          type="button"
          className={styles.headerBtn}
          onClick={onShowNotifications}
          title="Thông báo"
          aria-label="Xem thông báo hệ thống"
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className={styles.notifDot} />
        </button>
      </div>
    </header>
  );
};
