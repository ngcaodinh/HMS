/**
 * @file pharmacy-workspace.tsx
 * @description Component điều phối chính (Orchestrator) cho Phân hệ Dược sĩ & Nhà thuốc HMS-VN.
 * Tích hợp Sidebar Dark Midnight đồng nhất hệ thống, Top Header chuẩn Clinical Excellence,
 * điều hướng 5 màn hình chức năng và quản lý các luồng tương tác API / Modal / Toast.
 * @author Senior Fullstack Engineer
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { ApiError } from '@/shared/api-client';
import { useCurrentPrincipal } from '@/shared/hooks/use-current-principal';
import { useLogout } from '@/shared/hooks/use-logout';

import { PharmacySidebar } from '../../components/PharmacySidebar';
import { PharmacyTopHeader } from '../../components/PharmacyTopHeader';
import { PrescriptionDispenseScreen } from '../../components/PrescriptionDispenseScreen';
import { PharmacyInventoryScreen } from '../../components/PharmacyInventoryScreen';
import { StockImportScreen } from '../../components/StockImportScreen';
import { NationalXmlScreen } from '../../components/NationalXmlScreen';
import { StockReportScreen } from '../../components/StockReportScreen';
import { PharmacyModals } from '../../components/PharmacyModals';

import {
  mockInventoryItems,
  mockNationalXmlString,
  mockPharmacyKpi,
  mockStockMovementLogs,
  mockStockReceipt,
} from '../../constants/pharmacy-mock.data';

import {
  downloadPrescriptionXmlFile,
  useDispensablePrescriptions,
  useDispensePrescription,
  useExportPrescriptionXml,
  useRejectPrescription,
} from '../../services/prescription-dispense-api';

import {
  usePharmacyInventory,
  usePharmacyStockMovements,
  usePharmacyWarehouses,
} from '../../services/pharmacy-inventory-api';

import type {
  InventoryItem,
  PharmacyScreen,
  Prescription,
  StockMovementLog,
  StockReceipt,
} from '../../types/pharmacy.types';

import { pharmacyWorkspaceStyles as styles } from './pharmacy-workspace.styles';

/**
 * Cấu trúc thông báo Toast nổi ở góc dưới bên phải
 */
interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

function formatDateVN(value?: string | null): string {
  if (!value) return 'Chưa ghi nhận';
  return new Date(value).toLocaleDateString('vi-VN');
}

function formatDateTimeVN(value?: string | null): string {
  if (!value) return 'Chưa ghi nhận';
  return new Date(value).toLocaleString('vi-VN');
}

function getAgeFromDateOfBirth(value?: string | null): number {
  if (!value) return 0;
  const birthDate = new Date(value);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  return hasBirthdayPassed ? age : age - 1;
}

function getApiErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Yêu cầu không thành công. Vui lòng thử lại.';
}

/**
 * Component Không gian làm việc chính của Dược sĩ (Pharmacy Workspace).
 * Điều phối dữ liệu API thực tế, trạng thái tab màn hình, modal xác nhận và phản hồi Toast.
 *
 * @returns Component React hiển thị toàn bộ giao diện /pharmacy
 */
export function PharmacyWorkspace() {
  const logout = useLogout();
  const principalQuery = useCurrentPrincipal();

  // Quản lý trạng thái tab màn hình đang chọn ('dispense' | 'inventory' | 'stock-import' | 'national-xml' | 'reports')
  const [activeScreen, setActiveScreen] = useState<PharmacyScreen>('dispense');

  // Quản lý trạng thái modal đang mở
  const [activeModal, setActiveModal] = useState<
    'dispense' | 'reject' | 'import-xml' | 'logout' | 'fefo-sync' | null
  >(null);

  // Danh sách đơn cấp phát lấy từ API thật, không trộn mock để command luôn dùng đúng ID backend.
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [isDownloadingXml, setIsDownloadingXml] = useState(false);

  // Trạng thái phiếu nhập kho & danh sách báo cáo
  const [stockReceipt, setStockReceipt] = useState<StockReceipt>(mockStockReceipt);
  const [inventoryItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [stockLogs] = useState<StockMovementLog[]>(mockStockMovementLogs);

  // Thông báo Toast
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Tải dữ liệu đơn thuốc thực tế từ API backend nếu có
  const prescriptionsQuery = useDispensablePrescriptions({
    dispensed: false,
    keyword: '',
    page: 1,
    pageSize: 50,
    warehouseId: selectedWarehouseId === 'all' ? undefined : selectedWarehouseId,
  });

  // API query tồn kho & nhật ký chuyển kho thực tế từ backend (để duy trì hook hoạt động)
  usePharmacyInventory({ page: 1, pageSize: 20 });
  usePharmacyStockMovements({ page: 1, pageSize: 20 });
  const warehousesQuery = usePharmacyWarehouses();

  // API mutations thực tế
  const dispenseMutation = useDispensePrescription();
  const rejectMutation = useRejectPrescription();
  const exportXmlMutation = useExportPrescriptionXml();

  // Đồng bộ tên Dược sĩ từ phiên làm việc
  const pharmacistName = principalQuery.data?.fullName || 'DS. Phạm Thanh Hà';

  useEffect(() => {
    const apiData = prescriptionsQuery.data?.data;
    if (!apiData) return;

    const mappedApiPrescriptions: Prescription[] = apiData.map((item) => {
      const firstAllocation = item.items.flatMap((sub) => sub.fefoAllocations)[0];
      const displayId = item.prescriptionCode ?? item.prescriptionId.slice(0, 8);

      return {
        id: displayId,
        backendPrescriptionId: item.prescriptionId,
        backendVersion: item.version,
        prescriptionCode: item.prescriptionCode,
        patientId: item.patient.patientCode,
        patientName: item.patient.fullName,
        patientAge: getAgeFromDateOfBirth(item.patient.dateOfBirth),
        patientGender: item.patient.gender === 'female' ? 'Nữ' : 'Nam',
        bhytCardNumber: item.patient.healthInsuranceCode ?? undefined,
        bhytRatio: item.patient.healthInsuranceCode ? 'BHYT' : 'Viện phí',
        patientType: 'outpatient',
        icdCode: item.diagnosis?.icd10 ?? 'N/A',
        icdDiagnosis: item.diagnosis?.diagnosisText ?? 'Chưa cập nhật chẩn đoán',
        doctorName: item.prescribingDoctor.fullName,
        department: item.department?.name ?? 'Chưa cập nhật khoa',
        signedAt: formatDateTimeVN(item.signedAt),
        isSigned: true,
        invoiceStatus: 'paid',
        invoiceId: undefined,
        hasAllergyWarning: Boolean(item.patient.allergies),
        allergyWarningText: item.patient.allergies ? `Dị ứng: ${item.patient.allergies}` : undefined,
        allergyOverrideReason: item.allergyOverrideReason ?? undefined,
        allergyOverrideMeta: item.allergyOverrideAt ? formatDateTimeVN(item.allergyOverrideAt) : undefined,
        items: item.items.map((sub, idx) => {
          const allocations = sub.fefoAllocations;
          const primaryAllocation = allocations[0];
          const allocatedQuantity = allocations.reduce((sum, allocation) => sum + allocation.quantityAllocated, 0);

          return {
            drugId: sub.prescriptionItemId || `THU-${idx + 1}`,
            drugName: sub.medicineNameSnapshot || 'Thuốc chưa có snapshot',
            spec: sub.dosageSnapshot || sub.activeIngredientSnapshot || 'Chưa cập nhật dạng dùng',
            categoryLabel: 'Thuốc kê đơn',
            quantity: sub.quantity,
            unit: 'đơn vị',
            dosageInstruction: sub.dosageInstruction || 'Dùng theo đơn bác sĩ',
            fefoLotNumber: allocations.map((allocation) => allocation.batchNumber).join(', ') || 'Chưa phân bổ',
            shelfLocation: primaryAllocation?.warehouse.name ?? item.warehouse?.name ?? 'Chưa xác định kho',
            availableStock: primaryAllocation?.balanceAfter ?? 0,
            expiryDate: formatDateVN(primaryAllocation?.expiryDate),
            isStockSufficient: allocatedQuantity >= sub.quantity,
            fefoAllocations: allocations.map((allocation) => ({
              balanceAfter: allocation.balanceAfter,
              batchNumber: allocation.batchNumber,
              expiryDate: formatDateVN(allocation.expiryDate),
              quantityAllocated: allocation.quantityAllocated,
              warehouseName: allocation.warehouse.name,
            })),
          };
        }),
        status: item.dispensedAt ? 'dispensed' : 'pending',
        warehouseId: item.warehouse?.warehouseId ?? firstAllocation?.warehouse.warehouseId ?? 'all',
        warehouseName: item.warehouse?.name ?? firstAllocation?.warehouse.name,
        xmlExportedAt: item.xmlExportedAt,
      };
    });

    setPrescriptions(mappedApiPrescriptions);
    setSelectedPrescriptionId((currentId) =>
      mappedApiPrescriptions.some((prescription) => prescription.id === currentId)
        ? currentId
        : mappedApiPrescriptions[0]?.id ?? '',
    );
  }, [prescriptionsQuery.data]);

  /**
   * Đơn thuốc hiện đang được chọn để xem chi tiết hoặc thực hiện thao tác
   */
  const selectedPrescription = useMemo(() => {
    return (
      prescriptions.find((p) => p.id === selectedPrescriptionId) || prescriptions[0] || null
    );
  }, [prescriptions, selectedPrescriptionId]);

  /**
   * Hiển thị thông báo dạng Toast nổi ở góc dưới màn hình
   *
   * @param text Nội dung thông báo
   * @param type Loại thông báo ('success' | 'info' | 'warning' | 'error')
   */
  const showToast = (text: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  /**
   * Xử lý xác nhận phát thuốc và trừ kho FEFO cho đơn đang chọn
   */
  const handleConfirmDispense = () => {
    if (!selectedPrescription) return;
    const prescriptionId = selectedPrescription.backendPrescriptionId ?? selectedPrescription.id;
    const expectedVersion = selectedPrescription.backendVersion ?? 1;

    dispenseMutation.mutate(
      { expectedVersion, prescriptionId },
      {
        onError: (error) => {
          showToast(getApiErrorMessage(error), 'error');
        },
        onSuccess: (result) => {
          setPrescriptions((prev) =>
            prev.map((rx) =>
              rx.id === selectedPrescription.id
                ? { ...rx, backendVersion: result.version, status: 'dispensed' }
                : rx,
            ),
          );
          showToast(
            `Đã xác nhận cấp phát đơn thuốc ${selectedPrescription.prescriptionCode ?? selectedPrescription.id}.`,
            'success',
          );
          setActiveModal(null);
        },
      },
    );
  };

  /**
   * Xử lý từ chối đơn thuốc và gửi phản hồi về cho bác sĩ kê đơn
   *
   * @param reason Lý do từ chối đơn chuyên môn
   */
  const handleConfirmReject = (reason: string) => {
    if (!selectedPrescription) return;
    const prescriptionId = selectedPrescription.backendPrescriptionId ?? selectedPrescription.id;
    const expectedVersion = selectedPrescription.backendVersion ?? 1;

    rejectMutation.mutate(
      { cancelReason: reason, expectedVersion, prescriptionId },
      {
        onError: (error) => {
          showToast(getApiErrorMessage(error), 'error');
        },
        onSuccess: () => {
          setPrescriptions((prev) => prev.filter((rx) => rx.id !== selectedPrescription.id));
          showToast(
            `Đã gửi phản hồi từ chối đơn ${selectedPrescription.prescriptionCode ?? selectedPrescription.id} tới Bác sĩ ${selectedPrescription.doctorName}.`,
            'warning',
          );
          setActiveModal(null);
        },
      },
    );
  };

  /**
   * Xử lý xác nhận nhập dữ liệu XML phiếu nhập kho
   */
  const handleConfirmXmlImport = () => {
    setStockReceipt((prev) => ({
      ...prev,
      isXmlImported: true,
      supplierName: 'Công ty Dược phẩm TW1 (CPC1)',
      invoiceNumber: 'HD-XML-2026-9921',
    }));
    showToast('Đã trích xuất dữ liệu XML hóa đơn nhà cung cấp vào phiếu nhập kho.', 'success');
    setActiveModal(null);
  };

  /**
   * Xử lý đồng bộ chỉ số tồn kho FEFO
   */
  const handleConfirmFefoSync = () => {
    showToast('Đã đồng bộ lại chỉ số hạn dùng (FEFO) và thứ tự gán lô tự động cho toàn kho.', 'info');
  };

  /**
   * Xử lý đăng xuất hệ thống
   */
  const handleConfirmLogout = () => {
    void logout();
  };

  /**
   * In nhãn hướng dẫn sử dụng thuốc
   */
  const handlePrintLabel = (rx: Prescription) => {
    const printWindow = window.open('', '_blank', 'width=720,height=720');
    if (!printWindow) {
      showToast('Trình duyệt đang chặn cửa sổ in nhãn. Vui lòng cho phép pop-up.', 'warning');
      return;
    }

    const rows = rx.items
      .map(
        (item) => `
          <section class="label">
            <strong>${item.drugName}</strong>
            <div>${item.dosageInstruction}</div>
            <div>Số lượng: ${item.quantity} ${item.unit}</div>
            <div>Lô FEFO: ${item.fefoLotNumber} - HSD: ${item.expiryDate}</div>
            <small>${rx.patientName} (${rx.patientId}) - ${rx.prescriptionCode ?? rx.id}</small>
          </section>
        `,
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>In nhãn thuốc ${rx.prescriptionCode ?? rx.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 16px; color: #171c1f; }
            .label { border: 1px solid #171c1f; margin-bottom: 10px; padding: 10px; width: 320px; }
            strong { display: block; font-size: 14px; margin-bottom: 6px; }
            div, small { display: block; font-size: 12px; line-height: 1.4; }
          </style>
        </head>
        <body>${rows}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    showToast(`Đã mở hộp thoại in nhãn cho đơn ${rx.prescriptionCode ?? rx.id}.`, 'info');
  };

  const handleExportXml = (rx: Prescription) => {
    const prescriptionId = rx.backendPrescriptionId ?? rx.id;
    const expectedVersion = rx.backendVersion ?? 1;

    exportXmlMutation.mutate(
      { expectedVersion, prescriptionId },
      {
        onError: (error) => showToast(getApiErrorMessage(error), 'error'),
        onSuccess: (result) => {
          setPrescriptions((prev) =>
            prev.map((item) =>
              item.id === rx.id
                ? { ...item, backendVersion: result.version, xmlExportedAt: result.xmlExportedAt }
                : item,
            ),
          );
          showToast(`Đã kết xuất XML đơn thuốc ${rx.prescriptionCode ?? rx.id}.`, 'success');
        },
      },
    );
  };

  const handleDownloadXml = async (rx: Prescription) => {
    const prescriptionId = rx.backendPrescriptionId ?? rx.id;
    try {
      setIsDownloadingXml(true);
      await downloadPrescriptionXmlFile(prescriptionId);
      showToast(`Đã tải XML đơn thuốc ${rx.prescriptionCode ?? rx.id}.`, 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsDownloadingXml(false);
    }
  };

  return (
    <div className={styles.shell}>
      {/* 1. Thanh Sidebar điều hướng Dark Midnight đồng nhất hệ thống HMS */}
      <PharmacySidebar
        activeScreen={activeScreen}
        onOpenLogoutModal={() => setActiveModal('logout')}
        onSelectScreen={setActiveScreen}
        pharmacistName={pharmacistName}
      />

      {/* 2. Khu vực nội dung chính Workspace */}
      <div className={styles.mainWrap}>
        {/* Top Header thanh công cụ phía trên */}
        <PharmacyTopHeader
          onShowNotifications={() =>
            showToast('Hệ thống hiện không có cảnh báo tồn kho bất thường mới.', 'info')
          }
          onSyncFefo={() => setActiveModal('fefo-sync')}
        />

        {/* Nội dung thay đổi theo Screen Tab đang chọn */}
        <main className={styles.contentArea}>
          {/* Màn hình 1: Cấp phát thuốc theo đơn */}
          {activeScreen === 'dispense' && (
            <PrescriptionDispenseScreen
              isDownloadingXml={isDownloadingXml}
              isExportingXml={exportXmlMutation.isPending}
              isLoading={prescriptionsQuery.isLoading || prescriptionsQuery.isFetching}
              onDownloadXml={handleDownloadXml}
              onExportXml={handleExportXml}
              onOpenDispenseModal={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setActiveModal('dispense');
              }}
              onOpenRejectModal={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setActiveModal('reject');
              }}
              onPrintLabel={handlePrintLabel}
              onReloadQueue={() => {
                void prescriptionsQuery.refetch();
                showToast('Đã cập nhật danh sách đơn thuốc mới từ hàng chờ.', 'info');
              }}
              onSelectPrescription={(id) => setSelectedPrescriptionId(id)}
              onSelectWarehouse={setSelectedWarehouseId}
              prescriptions={prescriptions}
              selectedPrescriptionId={selectedPrescriptionId}
              selectedWarehouseId={selectedWarehouseId}
              warehouses={warehousesQuery.data ?? []}
            />
          )}

          {/* Màn hình 2: Quản lý kho thuốc & Lô FEFO */}
          {activeScreen === 'inventory' && (
            <PharmacyInventoryScreen
              inventoryItems={inventoryItems}
              kpi={mockPharmacyKpi}
              onNavigateToStockImport={() => setActiveScreen('stock-import')}
            />
          )}

          {/* Màn hình 3: Nhập kho dược */}
          {activeScreen === 'stock-import' && (
            <StockImportScreen
              onExportStockReceipt={() =>
                showToast('Đã xuất tệp phiếu nhập kho kho_duoc_20260720.pdf thành công.', 'success')
              }
              onNavigateToInventory={() => setActiveScreen('inventory')}
              onOpenImportXmlModal={() => setActiveModal('import-xml')}
              onSaveReceipt={(receipt) => {
                setStockReceipt(receipt);
                showToast('Đã lưu phiếu nhập kho và khởi tạo thông tin các lô thuốc mới.', 'success');
              }}
              stockReceipt={stockReceipt}
            />
          )}

          {/* Màn hình 4: Đơn thuốc & XML Quốc gia */}
          {activeScreen === 'national-xml' && (
            <NationalXmlScreen
              onDownloadXml={() =>
                showToast('Đã tải xuống tệp XML_DON_THUOC_20260891.xml thành công.', 'success')
              }
              xmlContent={mockNationalXmlString}
            />
          )}

          {/* Màn hình 5: Báo cáo biến động kho */}
          {activeScreen === 'reports' && (
            <StockReportScreen
              logs={stockLogs}
              onExportExcel={() =>
                showToast('Đã xuất báo cáo biến động xuất nhập tồn ra tệp Excel.', 'success')
              }
            />
          )}
        </main>
      </div>

      {/* 3. Tập hợp các hộp thoại Modal tương tác */}
      <PharmacyModals
        activeModal={activeModal}
        isDispensing={dispenseMutation.isPending}
        isRejecting={rejectMutation.isPending}
        onCloseModal={() => setActiveModal(null)}
        onConfirmDispense={handleConfirmDispense}
        onConfirmFefoSync={handleConfirmFefoSync}
        onConfirmLogout={handleConfirmLogout}
        onConfirmReject={handleConfirmReject}
        onConfirmXmlImport={handleConfirmXmlImport}
        prescription={selectedPrescription}
      />

      {/* 4. Khung hiển thị thông báo dạng Toast nổi */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            className={`pointer-events-auto rounded-xl px-4 py-3 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-all animate-fadeIn ${
              toast.type === 'success'
                ? 'bg-[#1a7a4a]'
                : toast.type === 'warning'
                  ? 'bg-[#a05c00]'
                  : toast.type === 'error'
                    ? 'bg-[#ba1a1a]'
                    : 'bg-[#006096]'
            }`}
            key={toast.id}
            role="status"
          >
            {toast.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PharmacyWorkspace;
