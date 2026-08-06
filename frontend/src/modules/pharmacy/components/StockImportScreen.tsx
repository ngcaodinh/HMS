/**
 * @file StockImportScreen.tsx
 * @description Màn hình 3: Nhập kho thuốc và quản lý lô mới, hỗ trợ nhập dữ liệu XML.
 */

'use client';

import React, { useState } from 'react';
import type { StockReceipt, StockReceiptItem } from '../types/pharmacy.types';
import { pharmacyWorkspaceStyles as styles } from '../pages/workspace/pharmacy-workspace.styles';

/**
 * Hợp đồng dữ liệu draft và callback của màn hình nhập kho.
 * `stockReceipt` là snapshot khởi tạo; các chỉnh sửa mặt hàng được giữ local cho tới khi người
 * dùng lưu, còn modal XML, xuất tệp, chuyển màn hình và persistence do workspace cha đảm nhiệm.
 */
interface StockImportScreenProps {
  /** Snapshot phiếu nhập kho hiện tại, gồm ngày dạng `YYYY-MM-DD` và tiền nguyên theo VNĐ. */
  stockReceipt: StockReceipt;
  /** Callback mở modal nhập XML hóa đơn nhà cung cấp. */
  onOpenImportXmlModal: () => void;
  /** Callback xuất tệp phiếu nhập kho; side effect tạo tệp do workspace cha thực hiện. */
  onExportStockReceipt: () => void;
  /** Callback chuyển sang màn hình danh mục tồn kho. */
  onNavigateToInventory: () => void;
  /** Callback lưu draft, khởi tạo các lô thuốc mới và đồng bộ thông báo thành công ở workspace. */
  onSaveReceipt: (receipt: StockReceipt) => void;
}

/**
 * Màn hình Nhập kho dược (Screen 3):
 * Cho phép Dược sĩ lập phiếu nhập kho thuốc từ nhà cung cấp, nhập thông tin số hóa đơn,
 * thêm các dòng thuốc, cấu hình số lô, ngày sản xuất, hạn sử dụng và giá nhập.
 *
 * @param stockReceipt Dữ liệu phiếu nhập kho khởi tạo
 * @param onOpenImportXmlModal Callback mở modal tải tệp XML hóa đơn
 * @param onExportStockReceipt Callback xuất tệp phiếu nhập
 * @param onNavigateToInventory Callback chuyển sang xem kho thuốc
 * @param onSaveReceipt Callback lưu thông tin phiếu nhập kho và nhập lô
 * @returns Component React màn hình Nhập kho dược
 * @remarks Màn hình không tự gọi API và không có loading/error từ server; success sau khi lưu,
 * xuất hoặc nhập XML được callback cha phản hồi. Giá trị thành tiền được tính local từ số lượng
 * và đơn giá, còn việc validate/persistence và trừ kho vẫn thuộc backend/workspace.
 */
export const StockImportScreen: React.FC<StockImportScreenProps> = ({
  stockReceipt,
  onOpenImportXmlModal,
  onExportStockReceipt,
  onNavigateToInventory,
  onSaveReceipt,
}) => {
  const [supplier, setSupplier] = useState<string>(stockReceipt.supplierName);
  const [invoiceNumber, setInvoiceNumber] = useState<string>(stockReceipt.invoiceNumber);
  const [receiptDate, setReceiptDate] = useState<string>(stockReceipt.receiptDate);
  const [isXmlImported, setIsXmlImported] = useState<boolean>(stockReceipt.isXmlImported);

  // Draft các dòng nhập kho; chỉ được gửi lên workspace khi người dùng bấm lưu.
  const [items, setItems] = useState<StockReceiptItem[]>(stockReceipt.items);

  /**
   * Xử lý thay đổi một field của dòng nhập kho.
   * `importQuantity` là số lượng theo đơn vị thuốc; `unitPrice` và `totalPrice` là số nguyên VNĐ.
   * Khi một trong hai giá trị đầu vào thay đổi, thành tiền được tính lại trong draft trước khi
   * render; hàm chưa thực hiện validation hoặc mutation server.
   */
  const handleItemChange = (index: number, field: keyof StockReceiptItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    // Giữ thành tiền nhất quán với số lượng và đơn giá trong draft hiện tại.
    if (field === 'importQuantity' || field === 'unitPrice') {
      const qty = Number(item.importQuantity) || 0;
      const price = Number(item.unitPrice) || 0;
      item.totalPrice = qty * price;
    }

    updated[index] = item;
    setItems(updated);
  };

  /** Thêm một dòng thuốc mặc định vào draft phiếu nhập, chưa ghi dữ liệu lên server. */
  const handleAddRow = () => {
    const newRow: StockReceiptItem = {
      id: `item-${Date.now()}`,
      drugName: 'Cetirizin 10mg (Hộp 30v)',
      lotNumber: `LOT-${new Date().getFullYear()}0810`,
      manufactureDate: '2026-05-15',
      expiryDate: '2028-05-15',
      importQuantity: 300,
      unitPrice: 45000,
      totalPrice: 13500000,
    };
    setItems([...items, newRow]);
  };

  /**
   * Xử lý sự kiện lưu phiếu nhập: cộng thành tiền các dòng rồi gửi snapshot cho callback cha.
   * Callback cha chịu trách nhiệm persistence, cập nhật tồn kho và hiển thị success/error.
   */
  const handleSave = () => {
    const total = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
    onSaveReceipt({
      receiptCode: stockReceipt.receiptCode,
      supplierName: supplier,
      invoiceNumber,
      receiptDate,
      items,
      totalAmount: total,
      isXmlImported,
    });
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề và các thao tác XML, xuất tệp, điều hướng. */}
      <div className={styles.screenHeader}>
        <div>
          <h2 className={styles.screenTitle}>Nhập kho thuốc &amp; Quản lý lô mới</h2>
          <p className={styles.screenSubtitle}>
            Tạo phiếu nhập kho dược từ Nhà cung cấp và cập nhật danh mục FEFO
          </p>
        </div>
        <div className={styles.screenActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
            onClick={onOpenImportXmlModal}
            aria-label="Import phiếu nhập kho bằng tệp XML"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <polyline points="12,18 12,12" />
              <polyline points="9,15 12,12 15,15" />
            </svg>
            Import bằng XML
          </button>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
            onClick={onExportStockReceipt}
            aria-label="Xuất dữ liệu phiếu nhập ra tệp XML/Excel"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Xuất XML / Excel
          </button>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
            onClick={onNavigateToInventory}
            aria-label="Quay lại danh mục kho thuốc"
          >
            ← Quay lại Kho thuốc
          </button>
        </div>
      </div>

      {/* Biểu mẫu draft phiếu nhập kho. */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <svg className="w-4 h-4 text-[#006096]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Biểu mẫu phiếu nhập kho dược:{' '}
            <span className="font-mono text-[#006096]">{stockReceipt.receiptCode}</span>
          </div>

          {isXmlImported && (
            <span className={`${styles.badge} ${styles.badgePaid}`}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Đã Import từ tệp XML
            </span>
          )}
        </div>

        <div className={styles.cardBody}>
          {/* Thông tin nhà cung cấp, hóa đơn và ngày nhập kho. */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className={styles.formLabel} htmlFor="select-ncc">
                Nhà cung cấp *
              </label>
              <select
                id="select-ncc"
                className={`${styles.selectField} w-full`}
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              >
                <option value="Công ty Dược phẩm TW1 (CPC1)">Công ty Dược phẩm TW1 (CPC1)</option>
                <option value="Công ty Cổ phần Dược Hậu Giang">Công ty Cổ phần Dược Hậu Giang</option>
                <option value="Công ty TNHH Sanofi Việt Nam">Công ty TNHH Sanofi Việt Nam</option>
              </select>
            </div>

            <div>
              <label className={styles.formLabel} htmlFor="input-hd">
                Số hóa đơn GTGT *
              </label>
              <input
                id="input-hd"
                type="text"
                className={styles.formControl}
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Nhập số hóa đơn..."
              />
            </div>

            <div>
              <label className={styles.formLabel} htmlFor="input-date-nk">
                Ngày nhập kho
              </label>
              <input
                id="input-date-nk"
                type="date"
                className={styles.formControl}
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
              />
            </div>
          </div>

          {/* Danh sách các lô thuốc và giá trị nhập kho. */}
          <h4 className="text-[13px] font-bold uppercase tracking-[0.5px] text-[#3f4851] mb-3">
            Chi tiết lô thuốc nhập kho
          </h4>

          <div className={`${styles.dataTableWrap} mb-4`}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th className={`${styles.th} min-w-[220px] whitespace-nowrap`}>Tên thuốc / Hoạt chất</th>
                  <th className={`${styles.th} min-w-[130px] whitespace-nowrap`}>Số lô (Batch)</th>
                  <th className={`${styles.th} min-w-[140px] whitespace-nowrap text-center`}>Ngày sản xuất</th>
                  <th className={`${styles.th} min-w-[140px] whitespace-nowrap text-center`}>Hạn sử dụng</th>
                  <th className={`${styles.th} min-w-[90px] whitespace-nowrap text-center`}>SL nhập</th>
                  <th className={`${styles.th} min-w-[120px] whitespace-nowrap text-right`}>Đơn giá nhập (đ)</th>
                  <th className={`${styles.th} min-w-[130px] whitespace-nowrap text-right`}>Thành tiền (đ)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className={styles.tr}>
                    <td className="p-1.5">
                      <select
                        className={`${styles.selectField} w-full text-[13px] min-h-[40px] px-2.5 py-1`}
                        value={item.drugName}
                        onChange={(e) => handleItemChange(idx, 'drugName', e.target.value)}
                        aria-label="Chọn mặt hàng thuốc nhập"
                      >
                        <option value="Clobetasol Propionate 0.05% (Tuýp 30g)">
                          Clobetasol Propionate 0.05% (Tuýp 30g)
                        </option>
                        <option value="Cetirizin 10mg (Hộp 30v)">Cetirizin 10mg (Hộp 30v)</option>
                        <option value="Acyclovir 200mg (Hộp 50v)">Acyclovir 200mg (Hộp 50v)</option>
                      </select>
                    </td>

                    <td className="p-1.5">
                      <input
                        type="text"
                        className={`${styles.formControl} font-mono text-[13px] min-h-[40px] px-2.5 py-1`}
                        value={item.lotNumber}
                        onChange={(e) => handleItemChange(idx, 'lotNumber', e.target.value)}
                        aria-label="Số lô nhập"
                      />
                    </td>

                    <td className="p-1.5 text-center">
                      <input
                        type="date"
                        className={`${styles.formControl} font-mono text-[13px] min-h-[40px] px-2.5 py-1 text-center`}
                        value={item.manufactureDate}
                        onChange={(e) => handleItemChange(idx, 'manufactureDate', e.target.value)}
                        aria-label="Ngày sản xuất"
                      />
                    </td>

                    <td className="p-1.5 text-center">
                      <input
                        type="date"
                        className={`${styles.formControl} font-mono text-[13px] min-h-[40px] px-2.5 py-1 text-center`}
                        value={item.expiryDate}
                        onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                        aria-label="Hạn sử dụng"
                      />
                    </td>

                    <td className="p-1.5 text-center">
                      <input
                        type="number"
                        className={`${styles.formControl} font-mono text-[13px] min-h-[40px] px-2.5 py-1 text-center`}
                        value={item.importQuantity}
                        onChange={(e) => handleItemChange(idx, 'importQuantity', e.target.value)}
                        aria-label="Số lượng nhập"
                      />
                    </td>

                    <td className="p-1.5 text-right">
                      <input
                        type="number"
                        className={`${styles.formControl} font-mono text-[13px] min-h-[40px] px-2.5 py-1 text-right`}
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        aria-label="Đơn giá nhập"
                      />
                    </td>

                    <td className="p-1.5 text-right whitespace-nowrap">
                      <span className="font-mono font-bold text-[#171c1f]">
                        {item.totalPrice.toLocaleString()} đ
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Thao tác thêm dòng và lưu draft phiếu nhập. */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
              onClick={handleAddRow}
              aria-label="Thêm dòng nhập thuốc mới"
            >
              + Thêm dòng thuốc
            </button>

            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleSave}
              aria-label="Lưu phiếu nhập kho và cập nhật kho FEFO"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Lưu phiếu nhập &amp; Cập nhật tồn kho FEFO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
