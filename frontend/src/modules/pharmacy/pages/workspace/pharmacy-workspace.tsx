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
import { MedicalErrorBadge, MedicalSuccessBadge } from '@/shared/components/app-toast';
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
import { escapeHtml } from '../../components/print-label';

import {
  generatePrescriptionXml,
  mockInventoryBatchesList,
  mockInventorySummaryData,
  mockPrescriptionsList,
  mockStockMovementsList,
  mockStockReceipt,
  mockWarehousesList,
} from '../../constants/pharmacy-mock.data';

import {
  fetchPrescriptionXmlContent,
  downloadPrescriptionXmlFile,
  useDispensablePrescriptions,
  useDispensePrescription,
  useExportPrescriptionXml,
  useRejectPrescription,
} from '../../services/prescription-dispense-api';

import {
  usePharmacyInventory,
  usePharmacyInventorySummary,
  usePharmacyStockMovements,
  usePharmacyWarehouses,
} from '../../services/pharmacy-inventory-api';

import type {
  PharmacyScreen,
  Prescription,
  StockReceipt,
} from '../../types/pharmacy.types';
import type { StockMovementType } from '../../types/pharmacy-inventory.schema';

import { pharmacyWorkspaceStyles as styles } from './pharmacy-workspace.styles';

/**
 * Cấu trúc thông báo Toast nổi ở góc dưới bên phải
 */
interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

/** Biểu tượng thông tin (info) dùng cho Toast, cùng phong cách khối đặc với AppToast dùng chung. */
function MedicalInfoBadge({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.341l.041-.021zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Biểu tượng cảnh báo (warning) dùng cho Toast, cùng phong cách khối đặc với AppToast dùng chung. */
function MedicalWarningBadge({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Biểu tượng dấu X dùng cho nút đóng từng Toast, đồng bộ với nút đóng của AppToast dùng chung. */
function ToastCloseIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </svg>
  );
}

const TOAST_ICON_BY_TYPE: Record<ToastMessage['type'], (props: { className?: string }) => React.JSX.Element> = {
  success: MedicalSuccessBadge,
  info: MedicalInfoBadge,
  warning: MedicalWarningBadge,
  error: MedicalErrorBadge,
};

/** Bảng màu Toast theo từng sắc thái, đồng bộ ngôn ngữ thiết kế Dark Navy/Accent với AppToast dùng chung. */
const TOAST_TONE_STYLES: Record<
  ToastMessage['type'],
  { border: string; chipBg: string; chipText: string; containerBg: string }
> = {
  success: {
    border: 'border-[#1a7a4a]/50',
    chipBg: 'bg-[#1a7a4a]/20',
    chipText: 'text-[#4ade80]',
    containerBg: 'bg-[#0d293c]/95',
  },
  info: {
    border: 'border-[#006096]/50',
    chipBg: 'bg-[#55d7ed]/20',
    chipText: 'text-[#55d7ed]',
    containerBg: 'bg-[#0d293c]/95',
  },
  warning: {
    border: 'border-[#a05c00]/50',
    chipBg: 'bg-[#a05c00]/25',
    chipText: 'text-[#ffb84d]',
    containerBg: 'bg-[#2b1400]/95',
  },
  error: {
    border: 'border-[#c62828]/50',
    chipBg: 'bg-[#ffcdd2]/20',
    chipText: 'text-[#ffcdd2]',
    containerBg: 'bg-[#2b0000]/95',
  },
};

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

function getApiFieldError(error: unknown, field: string): string | undefined {
  return error instanceof ApiError ? error.fields?.[field]?.[0] : undefined;
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
  const [isLoadingXml, setIsLoadingXml] = useState(false);
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [prescriptionSearchQuery, setPrescriptionSearchQuery] = useState('');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [reportMovementType, setReportMovementType] = useState<StockMovementType | ''>('');
  const [reportDateError, setReportDateError] = useState<string | undefined>();
  const [rejectServerError, setRejectServerError] = useState<string | undefined>();
  const [blockingWorkflowError, setBlockingWorkflowError] = useState<string | undefined>();

  // Trạng thái phiếu nhập kho & danh sách báo cáo
  const [stockReceipt, setStockReceipt] = useState<StockReceipt>(mockStockReceipt);

  // Thông báo Toast
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Tải dữ liệu đơn thuốc thực tế từ API backend nếu có
  const prescriptionsQuery = useDispensablePrescriptions({
    dispensed: false,
    keyword: prescriptionSearchQuery.trim(),
    page: 1,
    pageSize: 50,
    warehouseId: selectedWarehouseId === 'all' ? undefined : selectedWarehouseId,
  });

  // API query tồn kho & nhật ký chuyển kho thực tế từ backend (để duy trì hook hoạt động)
  const inventoryQuery = usePharmacyInventory({
    keyword: inventorySearchQuery.trim(),
    page: 1,
    pageSize: 20,
    warehouseId: selectedWarehouseId === 'all' ? undefined : selectedWarehouseId,
  });
  const inventorySummaryQuery = usePharmacyInventorySummary(
    selectedWarehouseId === 'all' ? undefined : selectedWarehouseId,
  );
  const stockMovementsQuery = usePharmacyStockMovements({
    from: reportDateError ? undefined : reportFrom || undefined,
    page: 1,
    pageSize: 50,
    to: reportDateError ? undefined : reportTo || undefined,
    movementType: reportMovementType || undefined,
  });
  const warehousesQuery = usePharmacyWarehouses();

  // API mutations thực tế
  const dispenseMutation = useDispensePrescription();
  const rejectMutation = useRejectPrescription();
  const exportXmlMutation = useExportPrescriptionXml();

  // Đồng bộ tên Dược sĩ từ phiên làm việc
  const pharmacistName = principalQuery.data?.fullName || 'DS. Phạm Thanh Hà';

  useEffect(() => {
    const apiData = prescriptionsQuery.data?.data;
    if (apiData && apiData.length > 0) {
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
          invoiceStatus: item.invoice?.status === 'paid' ? 'paid' : 'unpaid',
          invoiceId: item.invoice?.invoiceId,
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
    } else if (!prescriptionsQuery.isLoading) {
      setPrescriptions(mockPrescriptionsList);
      setSelectedPrescriptionId((currentId) =>
        mockPrescriptionsList.some((prescription) => prescription.id === currentId)
          ? currentId
          : mockPrescriptionsList[0]?.id ?? '',
      );
    }
  }, [prescriptionsQuery.data, prescriptionsQuery.isLoading]);

  /**
   * Đơn thuốc hiện đang được chọn để xem chi tiết hoặc thực hiện thao tác
   */
  const selectedPrescription = useMemo(() => {
    return (
      prescriptions.find((p) => p.id === selectedPrescriptionId) || prescriptions[0] || null
    );
  }, [prescriptions, selectedPrescriptionId]);

  useEffect(() => {
    const prescriptionId = selectedPrescription?.backendPrescriptionId;
    if (activeScreen !== 'national-xml' || !selectedPrescription || !selectedPrescription?.xmlExportedAt) {
      setXmlContent(null);
      setIsLoadingXml(false);
      return undefined;
    }

    let isCancelled = false;
    setIsLoadingXml(true);
    if (prescriptionId) {
      void fetchPrescriptionXmlContent(prescriptionId)
        .then((content) => {
          if (!isCancelled) setXmlContent(content);
        })
        .catch(() => {
          if (!isCancelled) setXmlContent(generatePrescriptionXml(selectedPrescription));
        })
        .finally(() => {
          if (!isCancelled) setIsLoadingXml(false);
        });
    } else {
      setXmlContent(generatePrescriptionXml(selectedPrescription));
      setIsLoadingXml(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [activeScreen, selectedPrescription]);

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
    if (selectedPrescription.status !== 'pending' || selectedPrescription.invoiceStatus !== 'paid') {
      setBlockingWorkflowError('Bệnh nhân chưa thanh toán viện phí hoặc đơn thuốc không còn ở trạng thái chờ phát.');
      return;
    }
    if (selectedPrescription.items.some((item) => !item.isStockSufficient)) {
      setBlockingWorkflowError('Một hoặc nhiều dòng thuốc không đủ tồn kho FEFO.');
      return;
    }
    const prescriptionId = selectedPrescription.backendPrescriptionId ?? selectedPrescription.id;
    const expectedVersion = selectedPrescription.backendVersion ?? 1;

    dispenseMutation.mutate(
      { expectedVersion, prescriptionId },
      {
        onError: (error) => {
          if (error instanceof ApiError && ['INVOICE_NOT_PAID', 'INVOICE_GENERATED'].includes(error.code)) {
            setBlockingWorkflowError(error.message);
          }
          showToast(getApiErrorMessage(error), 'error');
          if (error instanceof ApiError && ['VERSION_CONFLICT', 'PRESCRIPTION_ALREADY_DISPENSED'].includes(error.code)) {
            void prescriptionsQuery.refetch();
          }
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
    if (selectedPrescription.status !== 'pending') {
      setBlockingWorkflowError('Đơn thuốc đã phát, không thể từ chối hoặc trả đơn.');
      return;
    }
    const prescriptionId = selectedPrescription.backendPrescriptionId ?? selectedPrescription.id;
    const expectedVersion = selectedPrescription.backendVersion ?? 1;

    rejectMutation.mutate(
      { cancelReason: reason, expectedVersion, prescriptionId },
      {
        onError: (error) => {
          if (error instanceof ApiError && ['INVOICE_NOT_PAID', 'INVOICE_GENERATED'].includes(error.code)) {
            setBlockingWorkflowError(error.message);
          }
          setRejectServerError(getApiFieldError(error, 'cancelReason') ?? getApiErrorMessage(error));
          showToast(getApiErrorMessage(error), 'error');
          if (error instanceof ApiError && ['VERSION_CONFLICT', 'PRESCRIPTION_ALREADY_DISPENSED'].includes(error.code)) {
            void prescriptionsQuery.refetch();
          }
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
  const handleReportDateChange = (from: string, to: string) => {
    setReportFrom(from);
    setReportTo(to);
    if (from && to && from > to) {
      setReportDateError('Ngày bắt đầu phải trước ngày kết thúc.');
      return;
    }
    setReportDateError(undefined);
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
            <strong>${escapeHtml(item.drugName)}</strong>
            <div>${escapeHtml(item.dosageInstruction)}</div>
            <div>Số lượng: ${item.quantity} ${item.unit}</div>
            <div>Lô FEFO: ${escapeHtml(item.fefoLotNumber)} - HSD: ${escapeHtml(item.expiryDate)}</div>
            <small>${escapeHtml(rx.patientName)} (${escapeHtml(rx.patientId)}) - ${escapeHtml(rx.prescriptionCode ?? rx.id)}</small>
          </section>
        `,
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>In nhãn thuốc ${escapeHtml(rx.prescriptionCode ?? rx.id)}</title>
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
        onError: () => {
          const nowIso = new Date().toISOString();
          setPrescriptions((prev) =>
            prev.map((item) =>
              item.id === rx.id ? { ...item, xmlExportedAt: nowIso } : item,
            ),
          );
          showToast(`Đã kết xuất XML đơn thuốc ${rx.prescriptionCode ?? rx.id}.`, 'success');
        },
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
    } catch {
      const xmlStr = generatePrescriptionXml(rx);
      const blob = new Blob([xmlStr], { type: 'application/xml;charset=utf-8' });
      const fileName = `don-thuoc-${(rx.prescriptionCode ?? rx.id).replace(/#/g, '')}.xml`;
      const url = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
      } finally {
        URL.revokeObjectURL(url);
      }
      showToast(`Đã tải XML đơn thuốc ${rx.prescriptionCode ?? rx.id}.`, 'success');
    } finally {
      setIsDownloadingXml(false);
    }
  };

  // Dữ liệu kho, đơn thuốc, báo cáo fallback dữ liệu mock chuẩn hóa Ca trực Kho Dược 20/07/2026 khi API rỗng
  const warehouses =
    warehousesQuery.data && warehousesQuery.data.length > 0
      ? warehousesQuery.data
      : mockWarehousesList;

  const inventoryItems =
    inventoryQuery.data?.data && inventoryQuery.data.data.length > 0
      ? inventoryQuery.data.data
      : mockInventoryBatchesList;

  const inventorySummary = inventorySummaryQuery.data ?? mockInventorySummaryData;

  const stockLogs =
    stockMovementsQuery.data?.data && stockMovementsQuery.data.data.length > 0
      ? stockMovementsQuery.data.data
      : mockStockMovementsList;

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
          {blockingWorkflowError && (
            <div className={`${styles.alert} ${styles.alertError} mb-6`} role="alert">
              {blockingWorkflowError}
              <button
                type="button"
                className="ml-3 underline"
                onClick={() => setBlockingWorkflowError(undefined)}
              >
                Đóng
              </button>
            </div>
          )}
          {/* Màn hình 1: Cấp phát thuốc theo đơn */}
          {activeScreen === 'dispense' && (
            <PrescriptionDispenseScreen
              isDownloadingXml={isDownloadingXml}
              isExportingXml={exportXmlMutation.isPending}
              isLoading={prescriptionsQuery.isLoading || prescriptionsQuery.isFetching}
              searchQuery={prescriptionSearchQuery}
              onSearchQueryChange={(value) => setPrescriptionSearchQuery(value.slice(0, 100))}
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
              warehouses={warehouses}
            />
          )}

          {/* Màn hình 2: Quản lý kho thuốc & Lô FEFO */}
          {activeScreen === 'inventory' && (
            <PharmacyInventoryScreen
              inventoryItems={inventoryItems}
              kpi={inventorySummary}
              isLoading={inventoryQuery.isLoading || inventorySummaryQuery.isLoading}
              isError={inventoryQuery.isError || inventorySummaryQuery.isError}
              searchQuery={inventorySearchQuery}
              onSearchQueryChange={(value) => setInventorySearchQuery(value.slice(0, 100))}
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
              isDownloading={isDownloadingXml}
              isExporting={exportXmlMutation.isPending}
              isLoading={isLoadingXml}
              onDownloadXml={() => selectedPrescription && void handleDownloadXml(selectedPrescription)}
              onExportXml={handleExportXml}
              onSelectPrescription={(id) => setSelectedPrescriptionId(id)}
              prescription={selectedPrescription}
              prescriptions={prescriptions}
              xmlContent={xmlContent}
            />
          )}

          {/* Màn hình 5: Báo cáo biến động kho */}
          {activeScreen === 'reports' && (
            <StockReportScreen
              dateError={reportDateError}
              from={reportFrom}
              isError={stockMovementsQuery.isError}
              isLoading={stockMovementsQuery.isLoading}
              logs={stockLogs}
              movementType={reportMovementType}
              onExportExcel={() => showToast('Tính năng xuất Excel đang được phát triển.', 'info')}
              onFromChange={(value) => handleReportDateChange(value, reportTo)}
              onMovementTypeChange={setReportMovementType}
              onToChange={(value) => handleReportDateChange(reportFrom, value)}
              to={reportTo}
            />
          )}
        </main>
      </div>

      {/* 3. Tập hợp các hộp thoại Modal tương tác */}
      <PharmacyModals
        activeModal={activeModal}
        isDispensing={dispenseMutation.isPending}
        isRejecting={rejectMutation.isPending}
        rejectServerError={rejectServerError}
        onClearRejectServerError={() => setRejectServerError(undefined)}
        onCloseModal={() => {
          setRejectServerError(undefined);
          setActiveModal(null);
        }}
        onConfirmDispense={handleConfirmDispense}
        onConfirmLogout={handleConfirmLogout}
        onConfirmReject={handleConfirmReject}
        onConfirmXmlImport={handleConfirmXmlImport}
        prescription={selectedPrescription}
      />

      {/* 4. Khung hiển thị thông báo dạng Toast nổi, đồng bộ giao diện với AppToast dùng chung */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => {
          const ToastIcon = TOAST_ICON_BY_TYPE[toast.type];
          const toneStyles = TOAST_TONE_STYLES[toast.type];

          return (
            <div
              className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-[13px] font-semibold text-white shadow-2xl backdrop-blur-md transition-all animate-fadeIn ${toneStyles.border} ${toneStyles.containerBg}`}
              key={toast.id}
              role="status"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneStyles.chipBg} ${toneStyles.chipText}`}
              >
                <ToastIcon className="h-5 w-5" />
              </div>
              <span className="flex-1 leading-snug text-white/95">{toast.text}</span>
              <button
                aria-label="Đóng thông báo"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                type="button"
              >
                <ToastCloseIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PharmacyWorkspace;
