/**
 * @file pharmacy-workspace.tsx
 * @description Master Workspace Component cho Phân hệ Quản lý Dược & Nhà thuốc HMS-VN
 * @author Senior Frontend Engineer
 */

'use client';

import React, { useState } from 'react';
import type {
  InventoryItem,
  PharmacyKpiSummary,
  PharmacyScreen,
  Prescription,
  StockMovementLog,
  StockReceipt,
} from '../../types/pharmacy.types';
import {
  mockInventoryItems,
  mockNationalXmlString,
  mockPharmacyKpi,
  mockPrescriptions,
  mockStockMovementLogs,
  mockStockReceipt,
} from '../../constants/pharmacy-mock.data';
import { pharmacyWorkspaceStyles as styles } from './pharmacy-workspace.styles';

import { PharmacySidebar } from '../../components/PharmacySidebar';
import { PharmacyTopHeader } from '../../components/PharmacyTopHeader';
import { PrescriptionDispenseScreen } from '../../components/PrescriptionDispenseScreen';
import { PharmacyInventoryScreen } from '../../components/PharmacyInventoryScreen';
import { StockImportScreen } from '../../components/StockImportScreen';
import { NationalXmlScreen } from '../../components/NationalXmlScreen';
import { StockReportScreen } from '../../components/StockReportScreen';
import { PharmacyModals } from '../../components/PharmacyModals';

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

/**
 * Component chính điều hành giao diện Dược sĩ & Nhà thuốc
 */
export function PharmacyWorkspace() {
  // State điều hướng màn hình
  const [activeScreen, setActiveScreen] = useState<PharmacyScreen>('dispense');

  // State dữ liệu danh sách đơn thuốc
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(mockPrescriptions);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string>('0891');

  // State dữ liệu tồn kho & phiếu nhập & logs
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [stockReceipt, setStockReceipt] = useState<StockReceipt>(mockStockReceipt);
  const [logs, setLogs] = useState<StockMovementLog[]>(mockStockMovementLogs);
  const [kpi, setKpi] = useState<PharmacyKpiSummary>(mockPharmacyKpi);

  // State điều khiển Modals
  const [activeModal, setActiveModal] = useState<
    'dispense' | 'reject' | 'import-xml' | 'logout' | null
  >(null);

  // Toast Notification state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Hiển thị thông báo Toast
  const showToast = (text: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Đơn thuốc đang được chọn
  const selectedPrescription = prescriptions.find((p) => p.id === selectedPrescriptionId) || null;

  // Xử lý xác nhận cấp phát đơn thuốc
  const handleConfirmDispense = () => {
    if (!selectedPrescription) return;

    // Cập nhật trạng thái đơn thuốc sang 'dispensed'
    setPrescriptions((prev) =>
      prev.map((rx) => (rx.id === selectedPrescription.id ? { ...rx, status: 'dispensed' } : rx))
    );

    // Thêm bản ghi vào audit log
    const newLog: StockMovementLog = {
      id: `SM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      drugCode: 'THU-0012',
      drugName: 'Clobetasol Propionate 0.05%',
      lotNumber: 'LOT-20260412',
      movementType: `Xuất cấp phát #RX-${selectedPrescription.id}`,
      movementTypeBadge: 'paid',
      quantityChange: -2,
      quantityChangeText: '- 2 tuýp',
      postStock: 1448,
      unit: 'tuýp',
      executor: 'DS. Phạm Thanh Hà',
      timestamp: `${new Date().getHours().toString().padStart(2, '0')}:${new Date()
        .getMinutes()
        .toString()
        .padStart(2, '0')} · 20/07`,
    };
    setLogs((prev) => [newLog, ...prev]);

    setActiveModal(null);
    showToast(
      `Cấp phát thuốc thành công! Đã gán dispensedBy và trừ kho FEFO cho đơn #RX-2026-${selectedPrescription.id}`,
      'success'
    );
  };

  // Xử lý từ chối đơn thuốc
  const handleConfirmReject = (reason: string) => {
    if (!selectedPrescription) return;

    setPrescriptions((prev) =>
      prev.map((rx) => (rx.id === selectedPrescription.id ? { ...rx, status: 'cancelled' } : rx))
    );

    setActiveModal(null);
    showToast(
      `Đã từ chối cấp phát đơn #RX-2026-${selectedPrescription.id} và gửi phản hồi cho Bác sĩ kê đơn.`,
      'warning'
    );
  };

  // Xử lý nạp dữ liệu XML vào phiếu nhập
  const handleConfirmXmlImport = () => {
    setStockReceipt((prev) => ({
      ...prev,
      supplierName: 'Công ty Dược phẩm TW1 (CPC1)',
      invoiceNumber: 'HD-XML-2026-9921',
      isXmlImported: true,
      items: [
        {
          id: 'xml-item-1',
          drugName: 'Clobetasol Propionate 0.05% (Tuýp 30g)',
          lotNumber: 'LOT-20260799',
          manufactureDate: '2026-06-01',
          expiryDate: '2028-06-01',
          importQuantity: 500,
          unitPrice: 38000,
          totalPrice: 19000000,
        },
        {
          id: 'xml-item-2',
          drugName: 'Cetirizin 10mg (Hộp 30v)',
          lotNumber: 'LOT-20260810',
          manufactureDate: '2026-05-15',
          expiryDate: '2028-05-15',
          importQuantity: 300,
          unitPrice: 45000,
          totalPrice: 13500000,
        },
      ],
    }));
    setActiveModal(null);
    showToast('Đã Import dữ liệu thành công từ tệp XML Hóa đơn CPC1 vào phiếu nhập!', 'success');
  };

  // Xử lý lưu phiếu nhập kho
  const handleSaveStockReceipt = (updatedReceipt: StockReceipt) => {
    setStockReceipt(updatedReceipt);
    showToast(
      `Đã lưu phiếu nhập ${updatedReceipt.receiptCode} & cập nhật danh mục kho FEFO thành công!`,
      'success'
    );
  };

  // Toast feedback cho Đồng bộ FEFO
  const handleSyncFefo = () => {
    showToast('Đã hoàn tất đồng bộ tồn kho thực tế theo thuật toán FEFO!', 'success');
  };

  // Toast feedback cho Thông báo
  const handleShowNotifications = () => {
    showToast('Hệ thống kho dược hoạt động ổn định. Không có cảnh báo khẩn cấp mới.', 'info');
  };

  return (
    <div className={styles.shell}>
      {/* Sidebar Navigation */}
      <PharmacySidebar
        activeScreen={activeScreen}
        onSelectScreen={(screen) => setActiveScreen(screen)}
        onOpenLogoutModal={() => setActiveModal('logout')}
      />

      {/* Main Workspace Wrap */}
      <div className={styles.mainWrap}>
        <PharmacyTopHeader
          onSyncFefo={handleSyncFefo}
          onShowNotifications={handleShowNotifications}
        />

        <main className={styles.contentArea}>
          {activeScreen === 'dispense' && (
            <PrescriptionDispenseScreen
              prescriptions={prescriptions}
              selectedPrescriptionId={selectedPrescriptionId}
              onSelectPrescription={(id) => setSelectedPrescriptionId(id)}
              onReloadQueue={() =>
                showToast('Đã cập nhật danh sách đơn thuốc điện tử mới nhất!', 'info')
              }
              onOpenDispenseModal={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setActiveModal('dispense');
              }}
              onOpenRejectModal={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setActiveModal('reject');
              }}
              onPrintLabel={(rx) =>
                showToast(`Đã gửi lệnh in nhãn hướng dẫn cho đơn thuốc #RX-2026-${rx.id}`, 'info')
              }
            />
          )}

          {activeScreen === 'inventory' && (
            <PharmacyInventoryScreen
              inventoryItems={inventoryItems}
              kpi={kpi}
              onNavigateToStockImport={() => setActiveScreen('stock-import')}
            />
          )}

          {activeScreen === 'stock-import' && (
            <StockImportScreen
              stockReceipt={stockReceipt}
              onOpenImportXmlModal={() => setActiveModal('import-xml')}
              onExportStockReceipt={() =>
                showToast('Đã xuất dữ liệu phiếu nhập kho ra tệp XML/Excel!', 'success')
              }
              onNavigateToInventory={() => setActiveScreen('inventory')}
              onSaveReceipt={handleSaveStockReceipt}
            />
          )}

          {activeScreen === 'national-xml' && (
            <NationalXmlScreen
              xmlContent={mockNationalXmlString}
              onDownloadXml={() =>
                showToast('Đã tải xuống tệp đơn thuốc điện tử RX-2026-0891.xml', 'success')
              }
            />
          )}

          {activeScreen === 'reports' && (
            <StockReportScreen
              logs={logs}
              onExportExcel={() =>
                showToast('Đã xuất Báo cáo biến động kho ca trực ra tệp Excel!', 'success')
              }
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <PharmacyModals
        activeModal={activeModal}
        prescription={selectedPrescription}
        onCloseModal={() => setActiveModal(null)}
        onConfirmDispense={handleConfirmDispense}
        onConfirmReject={handleConfirmReject}
        onConfirmXmlImport={handleConfirmXmlImport}
        onConfirmLogout={() => {
          setActiveModal(null);
          showToast('Đã đăng xuất khỏi ca trực kho dược.', 'info');
        }}
      />

      {/* Toast Popup Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl p-4 text-[13px] font-semibold text-white shadow-xl transition-all animate-fadeIn ${
              t.type === 'success'
                ? 'bg-[#1a7a4a]'
                : t.type === 'warning'
                ? 'bg-[#a05c00]'
                : t.type === 'error'
                ? 'bg-[#ba1a1a]'
                : 'bg-[#006096]'
            }`}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PharmacyWorkspace;
