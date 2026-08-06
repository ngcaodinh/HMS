'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getApiErrorCode, getApiErrorMessage } from '@/shared/api-client/api-client';
import { performLogout } from '@/shared/auth/logout';
import { AppToast } from '@/shared/components/AppToast';
import { useAppToast } from '@/shared/hooks/use-app-toast';

import { AccountingScreenId, Invoice, PatientRecord } from '../../types/invoice.types';
import { AccountingHeader } from '../../components/AccountingHeader';
import { AccountingSidebar } from '../../components/AccountingSidebar';
import { PatientLookupScreen } from '../../components/PatientLookupScreen';
import { InvoiceCreationScreen } from '../../components/InvoiceCreationScreen';
import { PaymentStatementScreen } from '../../components/PaymentStatementScreen';
import { AdvanceManagementScreen } from '../../components/AdvanceManagementScreen';
import { ShiftReportScreen } from '../../components/ShiftReportScreen';
import { CashPaymentModal } from '../../components/modals/CashPaymentModal';
import { MomoQrModal } from '../../components/modals/MomoQrModal';
import { CancelInvoiceModal } from '../../components/modals/CancelInvoiceModal';
import { WriteoffModal } from '../../components/modals/WriteoffModal';
import { RefundModal } from '../../components/modals/RefundModal';
import { LogoutModal } from '../../components/modals/LogoutModal';
import {
  cancelInvoice,
  getInvoice,
  listInvoiceCandidates,
  listInvoices,
  writeOffInvoice,
  type InvoiceApiDto,
} from '../../services/invoice.api';
import {
  createPaymentAdvance,
  createPaymentAdvanceRefund,
  getPaymentAdvances,
  type PaymentAdvanceSummaryDto,
} from '../../services/payment-advance.api';
import {
  createMomoPaymentRequest,
  settleCashPayment,
  syncMomoPayment,
} from '../../services/payment.api';
import { getAccountingReport } from '../../services/accounting-report.api';

// Khóa sessionStorage để tiếp tục đúng invoice/order sau redirect MoMo; không lưu thông tin xác thực.
const SS_INVOICE = 'hms_momo_invoice_id';
const SS_ORDER = 'hms_momo_order_id';

/** Chuyển chuỗi số tiền từ API thành số hữu hạn, fallback 0 khi payload thiếu hoặc không hợp lệ. */
function moneyToNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Escape ô CSV và trung hòa tiền tố công thức trước khi mở bằng spreadsheet.
 * Mã nhận diện được xuất như dữ liệu, không được phép trở thành công thức khi tải file.
 */
function toSafeCsvCell(value: string): string {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

/** Trả về ngày hiện tại theo múi giờ Việt Nam, định dạng YYYY-MM-DD cho input date/API report. */
function getVietnamTodayInputValue(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Chuẩn hóa category item từ API sang enum hiển thị của invoice, fallback là dịch vụ khác. */
function mapInvoiceItemCategory(category: string): Invoice['items'][number]['category'] {
  if (category === 'consultation') return 'khambenh';
  if (category === 'lab') return 'xetnghiem';
  if (category === 'medicine') return 'thuoc';
  if (category === 'procedure') return 'phauthuat';
  return 'khac';
}

/**
 * Map DTO invoice từ backend sang model hiển thị của bảng kê và modal thanh toán.
 *
 * @param dto - DTO nguồn gồm status, item, BHYT, advance và amount dạng chuỗi.
 * @param patient - Hồ sơ fallback cho thông tin chưa có trong DTO, nếu có.
 * @returns Snapshot Invoice với tiền VNĐ dạng number và status UI đã chuẩn hóa.
 * @remarks Không tính lại tiền ở client; các fallback chỉ phục vụ hiển thị khi DTO thiếu dữ liệu.
 */
function mapApiInvoiceToView(dto: InvoiceApiDto, patient?: PatientRecord | null): Invoice {
  const fullName = dto.patient?.fullName ?? patient?.fullName ?? 'Bệnh nhân';
  return {
    id: dto.invoiceId,
    invoiceNumber: dto.invoiceId.slice(0, 8).toUpperCase(),
    patientId: dto.patient?.patientId ?? patient?.id ?? '',
    patientName: fullName,
    createdAt: patient?.admissionDate ?? new Date().toISOString(),
    status:
      dto.status === 'paid'
        ? 'paid'
        : dto.status === 'cancelled'
          ? 'cancelled'
          : dto.status === 'write_off'
            ? 'write_off'
            : 'pending_payment',
    items: dto.items.map((item, index) => ({
      id: item.invoiceItemId,
      code: `DV-${index + 1}`,
      name: item.description,
      category: mapInvoiceItemCategory(item.category),
      quantity: moneyToNumber(item.quantity),
      unitPrice: moneyToNumber(item.unitPrice),
      totalPrice: moneyToNumber(item.amount),
      bhytCoverRate: item.healthInsuranceBenefitRateSnapshot
        ? moneyToNumber(item.healthInsuranceBenefitRateSnapshot)
        : 0,
      bhytPays: moneyToNumber(item.healthInsuranceFundAmount),
      patientPays: moneyToNumber(item.patientCoPayAmount),
    })),
    subtotal: moneyToNumber(dto.subtotal),
    bhytDiscount: moneyToNumber(dto.healthInsuranceDiscountAmount),
    advanceDeduction: moneyToNumber(dto.advanceAppliedAmount),
    finalAmount: moneyToNumber(dto.amountDue),
    paymentMethod:
      dto.paymentMethod === 'momo' ? 'momo' : dto.paymentMethod === 'cash' ? 'cash' : undefined,
    receiptNumber: dto.receiptNumber,
    paidAt: dto.paidAt,
  };
}

/**
 * Map DTO invoice thành hồ sơ dùng cho lookup/bảng kê và màn tạm ứng.
 *
 * @param dto - DTO invoice chứa recordId, patient, status và các tổng tiền từ backend.
 * @param fallback - Snapshot hồ sơ cũ để giữ các trường không có trong response invoice.
 * @returns PatientRecord hiển thị; status được ánh xạ theo lifecycle invoice.
 * @remarks Số tiền chuyển về số VNĐ để trình bày, không phải phép tính hoặc nguồn quyền hạn mới.
 */
function mapInvoiceToPatient(dto: InvoiceApiDto, fallback?: PatientRecord | null): PatientRecord {
  const healthInsuranceEligibility = dto.healthInsuranceEligibility;
  return {
    id: dto.patient?.patientId ?? dto.recordId,
    recordId: dto.recordId,
    code: dto.patient?.patientCode ?? '—',
    fullName: dto.patient?.fullName ?? 'Bệnh nhân',
    dob: fallback?.dob ?? 'Chưa cập nhật',
    gender: fallback?.gender ?? 'Chưa cập nhật',
    bhytCardNumber: fallback?.bhytCardNumber ?? 'Chưa cập nhật',
    bhytBenefitRate: healthInsuranceEligibility
      ? moneyToNumber(healthInsuranceEligibility.effectiveBenefitRate)
      : (fallback?.bhytBenefitRate ?? 0),
    bhytCategory:
      healthInsuranceEligibility?.healthInsuranceRouteType ??
      fallback?.bhytCategory ??
      'Chưa cập nhật',
    department: dto.patient?.department ?? fallback?.department ?? 'Chưa phân khoa',
    admissionDate: fallback?.admissionDate ?? 'Chưa cập nhật',
    status:
      dto.status === 'paid'
        ? 'settled'
        : dto.status === 'cancelled'
          ? 'cancelled'
          : dto.status === 'write_off'
            ? 'write_off'
            : 'pending_payment',
    depositAmount: moneyToNumber(dto.advanceAppliedAmount),
    totalServicesAmount: moneyToNumber(dto.subtotal),
    bhytTotalPays: moneyToNumber(dto.healthInsuranceDiscountAmount),
    patientCoPayAmount: moneyToNumber(dto.amountDue),
    remainingAmount: dto.status === 'pending' ? moneyToNumber(dto.amountDue) : 0,
    healthInsuranceExpiryDate: fallback?.healthInsuranceExpiryDate ?? null,
    treatmentType: dto.patient?.treatmentType,
    bedId: dto.patient?.bedId,
    isEmergency: fallback?.isEmergency,
  };
}

/**
 * Map candidate chưa có invoice thành hồ sơ pending để lookup mở bước lập hóa đơn.
 * Dữ liệu dịch vụ chỉ là snapshot đầu vào; server vẫn là nguồn đơn giá và tổng tiền chính thức.
 */
function mapCandidateToPatient(
  candidate: Awaited<ReturnType<typeof listInvoiceCandidates>>['items'][number],
): PatientRecord {
  const serviceItems = candidate.serviceOrders.map((serviceOrder) => ({
    id: serviceOrder.id,
    code: serviceOrder.code,
    name: serviceOrder.name,
    category: 'khambenh' as const,
    quantity: 1,
    unitPrice: moneyToNumber(serviceOrder.fee),
    totalPrice: moneyToNumber(serviceOrder.fee),
    bhytCoverRate: 0,
    bhytPays: 0,
    patientPays: moneyToNumber(serviceOrder.fee),
  }));
  const totalServicesAmount = serviceItems.reduce((total, item) => total + item.totalPrice, 0);

  return {
    id: candidate.patient.patientId,
    recordId: candidate.recordId,
    code: candidate.patient.patientCode,
    fullName: candidate.patient.fullName,
    dob: new Date(candidate.patient.dateOfBirth).toLocaleDateString('vi-VN'),
    gender:
      candidate.patient.gender === 'female'
        ? 'Nữ'
        : candidate.patient.gender === 'male'
          ? 'Nam'
          : 'Chưa cập nhật',
    bhytCardNumber: candidate.patient.healthInsuranceCode ?? 'Chưa cập nhật',
    bhytBenefitRate: candidate.patient.healthInsuranceCode ? 0.8 : 0,
    bhytCategory: candidate.patient.healthInsuranceCode ? 'Theo hồ sơ' : 'Không có BHYT',
    department: candidate.department ?? 'Chưa phân khoa',
    admissionDate: new Date(candidate.createdAt).toLocaleString('vi-VN'),
    status: 'pending_payment',
    depositAmount: 0,
    totalServicesAmount,
    bhytTotalPays: 0,
    patientCoPayAmount: 0,
    remainingAmount: 0,
    phoneNumber: candidate.patient.phoneNumber,
    identityCardNumber: candidate.patient.identityCardNumber,
    healthInsuranceExpiryDate: candidate.patient.healthInsuranceExpiryDate,
    treatmentType: candidate.treatmentType,
    bedId: candidate.bedId,
    isEmergency: candidate.isEmergency,
    serviceItems,
  };
}

/**
 * Điều phối toàn bộ workspace thu ngân/kế toán từ tra cứu tới báo cáo ca.
 *
 * @remarks Workspace sở hữu server state của hồ sơ, invoice, tạm ứng, report và các modal; dữ liệu
 * được tải từ API và hiển thị loading/error/empty theo từng màn hình. Mutation cash, MoMo, cancel,
 * write-off và refund luôn gọi backend rồi invalidate/refetch snapshot liên quan. Polling MoMo dùng
 * sequence/cancel guard và cleanup khi unmount hoặc đổi URL. Các sidebar/modal chỉ là UI gate; backend
 * vẫn là nơi authorization, version check và quyết định trạng thái tài chính.
 */
export function AccountingWorkspaceView() {
  const [activeScreen, setActiveScreen] = useState<AccountingScreenId>('s1');
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [apiInvoiceId, setApiInvoiceId] = useState<string | null>(null);
  const [apiInvoiceVersion, setApiInvoiceVersion] = useState(1);
  const [pendingInvoices, setPendingInvoices] = useState<InvoiceApiDto[]>([]);
  const [isPatientsLoading, setIsPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [advanceSummary, setAdvanceSummary] = useState<PaymentAdvanceSummaryDto | null>(null);
  const [isAdvanceLoading, setIsAdvanceLoading] = useState(false);
  const [momoPayUrl, setMomoPayUrl] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isRedirectingMomo, setIsRedirectingMomo] = useState(false);
  const [reportFromDate, setReportFromDate] = useState(getVietnamTodayInputValue());
  const [reportToDate, setReportToDate] = useState(getVietnamTodayInputValue());
  const [reportSummary, setReportSummary] = useState<import('../../types/invoice.types').ShiftSummary | null>(null);
  const [reportLogs, setReportLogs] = useState<import('../../types/invoice.types').TransactionLog[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const pendingLoadSequenceRef = useRef(0);
  const advanceLoadSequenceRef = useRef(0);

  const [isCashOpen, setIsCashOpen] = useState(false);
  const [isMomoOpen, setIsMomoOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isWriteoffOpen, setIsWriteoffOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const { hideToast, showToast, toast: notification } = useAppToast(4500);

  /**
   * Tải danh sách invoice và candidate từ backend rồi thay thế snapshot lookup.
   * Sequence guard bỏ qua response cũ khi người dùng refresh liên tiếp; lỗi xóa snapshot hiện tại,
   * hiển thị toast/error state và success sẽ invalidate dữ liệu sau các mutation tài chính.
   */
  const loadPendingFromApi = useCallback(async () => {
    const requestSequence = ++pendingLoadSequenceRef.current;
    setIsPatientsLoading(true);
    setPatientsError(null);
    try {
      const [result, candidates] = await Promise.all([
        // Tải toàn bộ trạng thái để các bộ lọc Đã thanh toán/Đã hủy/Write-off hoạt động.
        listInvoices({ pageSize: 100 }),
        listInvoiceCandidates({ pageSize: 50 }),
      ]);
      if (requestSequence !== pendingLoadSequenceRef.current) {
        return;
      }
      setPendingInvoices(result.items);
      setPatients([
        ...result.items.map((invoice) => mapInvoiceToPatient(invoice)),
        ...candidates.items.map(mapCandidateToPatient),
      ]);
      setPatientsError(null);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không tải được danh sách hồ sơ kế toán');
      setPendingInvoices([]);
      setPatients([]);
      setPatientsError(message);
      showToast(message, 'error');
    } finally {
      if (requestSequence === pendingLoadSequenceRef.current) {
        setIsPatientsLoading(false);
      }
    }
  }, [showToast]);

  /**
   * Tải summary tạm ứng theo recordId và giữ lại response mới nhất.
   *
   * @param recordId - Mã hồ sơ nội trú dùng làm query tới API tạm ứng.
   * @remarks Sequence guard chống stale response khi đổi bệnh nhân; lỗi đưa summary về null và
   * thông báo parent, còn retry do effect gọi lại khi hồ sơ/màn hình phù hợp.
   */
  const loadAdvanceSummary = useCallback(
    async (recordId: string) => {
      const requestSequence = ++advanceLoadSequenceRef.current;
      setIsAdvanceLoading(true);
      try {
        const summary = await getPaymentAdvances(recordId);
        if (requestSequence !== advanceLoadSequenceRef.current) {
          return;
        }
        setAdvanceSummary(summary);
      } catch (error) {
        if (requestSequence !== advanceLoadSequenceRef.current) {
          return;
        }
        setAdvanceSummary(null);
        showToast(getApiErrorMessage(error, 'Không tải được lịch sử tạm ứng'), 'error');
      } finally {
        if (requestSequence === advanceLoadSequenceRef.current) {
          setIsAdvanceLoading(false);
        }
      }
    },
    [showToast],
  );

  /**
   * Tải báo cáo ca theo khoảng ngày YYYY-MM-DD.
   * Khoảng ngày sai chỉ cập nhật error state; response thành công thay thế summary/log, lỗi xóa dữ
   * liệu cũ để không hiển thị nhầm báo cáo và không tự thực hiện mutation tài chính.
   */
  const loadAccountingReport = useCallback(async () => {
    if (!reportFromDate || !reportToDate || reportFromDate > reportToDate) {
      setReportError('Khoảng ngày báo cáo không hợp lệ.');
      return;
    }
    setIsReportLoading(true);
    setReportError(null);
    try {
      const result = await getAccountingReport(reportFromDate, reportToDate);
      setReportSummary(result.summary);
      setReportLogs(result.logs);
    } catch (error) {
      setReportSummary(null);
      setReportLogs([]);
      setReportError(getApiErrorMessage(error, 'Không tải được báo cáo ca trực'));
    } finally {
      setIsReportLoading(false);
    }
  }, [reportFromDate, reportToDate]);

  // Khi mở màn tạm ứng hoặc đổi recordId, đồng bộ server state; rời màn hình sẽ tăng sequence để
  // response cũ không ghi đè hồ sơ mới và xóa summary khỏi UI.
  useEffect(() => {
    if (activeScreen !== 's4' || !selectedPatient?.recordId) {
      advanceLoadSequenceRef.current += 1;
      setAdvanceSummary(null);
      setIsAdvanceLoading(false);
      return;
    }
    void loadAdvanceSummary(selectedPatient.recordId);
  }, [activeScreen, loadAdvanceSummary, selectedPatient?.recordId]);

  // Khi mở màn báo cáo, gọi lại API theo khoảng ngày hiện tại; loading/error do callback quản lý.
  useEffect(() => {
    if (activeScreen === 's5') {
      void loadAccountingReport();
    }
  }, [activeScreen, loadAccountingReport]);

  /**
   * Mở một invoice từ backend và đồng bộ patient/version trước khi vào màn bảng kê.
   * Lỗi được đưa vào toast; không dùng dữ liệu local thay cho response mới nhất.
   */
  const openInvoiceFromApi = useCallback(
    async (invoiceId: string, fallbackPatient?: PatientRecord | null) => {
      setIsBusy(true);
      try {
        const dto = await getInvoice(invoiceId);
        const patient = mapInvoiceToPatient(dto, fallbackPatient);
        setSelectedPatient(patient);
        setApiInvoiceId(dto.invoiceId);
        setApiInvoiceVersion(dto.version);
        setCurrentInvoice(mapApiInvoiceToView(dto, patient));
        setActiveScreen('s3');
      } catch (error) {
        showToast(getApiErrorMessage(error, 'Không mở được hóa đơn'), 'error');
      } finally {
        setIsBusy(false);
      }
    },
    [showToast],
  );

  // Tải lookup và khôi phục invoice MoMo sau redirect; cleanup đánh dấu hủy để poll không cập nhật UI
  // hoặc lên lịch lần tiếp theo sau khi effect bị hủy.
  useEffect(() => {
    void loadPendingFromApi();

    const params = new URLSearchParams(window.location.search);
    const momoReturn = params.get('momo') === 'return';
    const invoiceIdFromUrl = params.get('invoiceId');
    const storedId = sessionStorage.getItem(SS_INVOICE);
    // Chỉ resume khi URL/return flag có invoiceId hoặc sessionStorage còn id từ lần redirect trước.
    const resumeId = momoReturn || invoiceIdFromUrl ? invoiceIdFromUrl || storedId : null;

    if (!resumeId) {
      return;
    }

    let cancelled = false;
    let attempts = 0;

    // Nạp snapshot cuối cùng vào bảng kê và dọn khóa redirect sau khi polling kết thúc.
    const finishPaid = async (id: string) => {
      const dto = await getInvoice(id);
      if (cancelled) {
        return;
      }
      const patient = mapInvoiceToPatient(dto);
      setSelectedPatient(patient);
      setApiInvoiceId(dto.invoiceId);
      setApiInvoiceVersion(dto.version);
      setCurrentInvoice(mapApiInvoiceToView(dto, patient));
      setActiveScreen('s3');
      sessionStorage.removeItem(SS_INVOICE);
      sessionStorage.removeItem(SS_ORDER);
      window.history.replaceState({}, '', '/accounting');
      if (dto.status === 'paid') {
        showToast('Đã ghi nhận thanh toán MoMo.');
        void loadPendingFromApi();
      }
    };

    // Poll tối đa 20 lần, mỗi lần cách nhau 2.5 giây; cancellation ngăn timer/request cũ cập nhật UI.
    const poll = async () => {
      try {
        await syncMomoPayment(resumeId);
        const status = await getInvoice(resumeId);
        if (status.status === 'paid') {
          await finishPaid(resumeId);
          return;
        }
      } catch {
        // Lỗi đồng bộ tạm thời không kết thúc luồng; lần poll kế tiếp hoặc fallback sẽ báo trạng thái.
      }
      attempts += 1;
      if (attempts < 20 && !cancelled) {
        window.setTimeout(() => {
          void poll();
        }, 2500);
      } else if (!cancelled) {
        await finishPaid(resumeId);
        showToast('Chưa xác nhận được thanh toán MoMo. Vui lòng tải lại hóa đơn.', 'error');
      }
    };

    showToast('Đang xác nhận thanh toán MoMo…');
    void poll();

    return () => {
      cancelled = true;
    };
  }, [loadPendingFromApi, showToast]);

  /**
   * Chọn hồ sơ từ lookup và mở invoice pending tương ứng nếu đã tồn tại.
   * Nếu chưa có invoice, chỉ chuyển sang form lập; không tạo mutation tại bước chọn.
   */
  const handleSelectPatientForInvoice = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    // Mở hóa đơn pending tương ứng nếu hồ sơ đã có hóa đơn trên hệ thống.
    const match = pendingInvoices.find(
      (inv) => inv.patient?.patientCode === patient.code || inv.patient?.patientId === patient.id,
    );
    if (match) {
      void openInvoiceFromApi(match.invoiceId, patient);
      return;
    }
    setActiveScreen('s2');
  };

  /** Nhận DTO invoice vừa tạo, guard patient rồi mở bảng kê thanh toán bằng snapshot server. */
  const handleProceedToPayment = (dto: InvoiceApiDto) => {
    if (!selectedPatient) {
      showToast('Không xác định được hồ sơ bệnh nhân.', 'error');
      return;
    }
    setApiInvoiceId(dto.invoiceId);
    setApiInvoiceVersion(dto.version);
    setCurrentInvoice(mapApiInvoiceToView(dto, selectedPatient));
    setActiveScreen('s3');
  };

  /**
   * Đồng bộ UI sau khi backend đã xác nhận paid và nạp lại lookup snapshot.
   * Chỉ cập nhật hồ sơ/invoice đang chọn; loadPendingFromApi tiếp tục invalidate dữ liệu danh sách.
   */
  const applyPaidUi = () => {
    if (!selectedPatient || !currentInvoice) {
      return;
    }
    setPatients((prev) =>
      prev.map((p) =>
        p.code === selectedPatient.code ? { ...p, status: 'settled', remainingAmount: 0 } : p,
      ),
    );
    setSelectedPatient((prev) =>
      prev
        ? {
            ...prev,
            status: 'settled',
            remainingAmount: 0,
          }
        : null,
    );
    setCurrentInvoice((prev) =>
      prev
        ? {
            ...prev,
            status: 'paid',
          }
        : null,
    );
    setActiveScreen('s3');
    void loadPendingFromApi();
  };

  /**
   * Thu tiền mặt cho invoice hiện tại, refresh version/invoice rồi invalidate lookup.
   * Guard thiếu invoice, lỗi API và success receipt đều được phản hồi bằng toast; backend quyết định
   * quyền thu, version và số tiền hợp lệ.
   */
  const handleCashConfirm = async () => {
    if (!selectedPatient || !apiInvoiceId) {
      showToast('Chưa có hóa đơn. Vui lòng lập hóa đơn trước.', 'error');
      return;
    }
    try {
      const invoiceId = apiInvoiceId;
      const result = await settleCashPayment(invoiceId);
      const refreshed = await getInvoice(invoiceId);
      setApiInvoiceVersion(refreshed.version);
      setCurrentInvoice(mapApiInvoiceToView(refreshed, selectedPatient));
      setIsCashOpen(false);
      applyPaidUi();
      showToast(`Đã thu tiền mặt · Phiếu ${result.receiptNumber}`);
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Thu tiền mặt thất bại'), 'error');
    }
  };

  /**
   * Tạo yêu cầu MoMo, lưu id cần resume vào sessionStorage rồi redirect tới payUrl.
   * Lỗi tạo request khôi phục trạng thái modal/bận và hiển thị toast; thanh toán chỉ được xác nhận qua
   * polling/sync backend sau khi redirect trở về.
   */
  const handleOpenMomo = async () => {
    if (!apiInvoiceId) {
      showToast('Chưa có hóa đơn để thanh toán MoMo.', 'error');
      return;
    }
    setIsBusy(true);
    setIsRedirectingMomo(true);
    try {
      const momo = await createMomoPaymentRequest(apiInvoiceId);
      if (!momo.payUrl) {
        throw new Error('Momo không trả payUrl');
      }
      sessionStorage.setItem(SS_INVOICE, apiInvoiceId);
      sessionStorage.setItem(SS_ORDER, momo.momoOrderId);
      setMomoPayUrl(momo.payUrl);
      showToast('Đang chuyển đến cổng thanh toán MoMo…');
      // Redirect tới trang MoMo để người dùng chọn QR/ví/ATM/Visa/Mastercard theo payWithMethod.
      window.location.href = momo.payUrl;
    } catch (error) {
      setIsRedirectingMomo(false);
      setIsMomoOpen(false);
      showToast(
        getApiErrorMessage(
          error,
          'Không thể tạo giao dịch MoMo. Vui lòng thử lại.',
        ),
        'error',
      );
    } finally {
      setIsBusy(false);
    }
  };

  /**
   * Hủy invoice pending với expectedVersion và lý do từ modal.
   * Conflict/version hoặc invoice đã đổi sẽ mở lại snapshot mới; success invalidates lookup và quay
   * về tra cứu, còn lỗi khác giữ nguyên context để parent hiển thị toast.
   */
  const handleCancelInvoice = async (reason: string) => {
    if (!apiInvoiceId) {
      showToast(
        'Chưa có hóa đơn để hủy.',
        'error',
      );
      return;
    }
    try {
      await cancelInvoice(apiInvoiceId, {
        expectedVersion: apiInvoiceVersion,
        cancelReason: reason,
      });
      showToast('Đã hủy hóa đơn.');
      void loadPendingFromApi();
    } catch (error) {
      if (
        getApiErrorCode(error) === 'VERSION_CONFLICT' ||
        getApiErrorCode(error) === 'INVOICE_NOT_PENDING'
      ) {
        void openInvoiceFromApi(apiInvoiceId);
        showToast('Hóa đơn đã thay đổi. Dữ liệu đã được tải lại.', 'error');
        return;
      }
      showToast(getApiErrorMessage(error, 'Hủy hóa đơn thất bại'), 'error');
      return;
    }
    setIsCancelOpen(false);
    setApiInvoiceId(null);
    setActiveScreen('s1');
  };

  /**
   * Ghi nhận write-off invoice pending theo version hiện tại rồi invalidates lookup.
   * Backend quyết định quyền và trạng thái; conflict trạng thái sẽ mở lại invoice mới để tránh ghi đè.
   */
  const handleWriteoff = async (reason: string) => {
    if (!apiInvoiceId) {
      showToast('Chưa có hóa đơn để ghi nhận miễn giảm.', 'error');
      return;
    }
    try {
      const updated = await writeOffInvoice(apiInvoiceId, {
        expectedVersion: apiInvoiceVersion,
        writeOffReason: reason,
      });
      setApiInvoiceVersion(updated.version);
      setCurrentInvoice(mapApiInvoiceToView(updated, selectedPatient));
      setIsWriteoffOpen(false);
      setApiInvoiceId(null);
      void loadPendingFromApi();
      setActiveScreen('s1');
      showToast('Đã ghi nhận miễn giảm.');
      return;
    } catch (error) {
      if (getApiErrorCode(error) === 'INVOICE_NOT_PENDING') {
        void openInvoiceFromApi(apiInvoiceId);
      }
      showToast(getApiErrorMessage(error, 'Ghi nhận write-off thất bại'), 'error');
      return;
    }
  };

  /**
   * Hoàn toàn bộ balance tạm ứng hiện tại sau khi guard hồ sơ và số dư dương.
   * Thành công tải lại summary để invalidate số dư; lỗi giữ modal/context và phản hồi bằng toast.
   */
  const handleRefundSuccess = async (reason: string) => {
    if (!selectedPatient) {
      showToast('Chưa chọn hồ sơ bệnh nhân.', 'error');
      return;
    }
    const recordId = selectedPatient.recordId;
    const amount = advanceSummary ? moneyToNumber(advanceSummary.balance) : 0;
    if (!recordId || amount <= 0) {
      showToast('Không có số dư tạm ứng để hoàn trả.', 'error');
      return;
    }
    setIsBusy(true);
    try {
      await createPaymentAdvanceRefund(recordId, { amountVnd: amount, reason });
      await loadAdvanceSummary(recordId);
      setIsRefundOpen(false);
      showToast(`Đã hoàn tạm ứng · ${amount.toLocaleString('vi-VN')} đ`);
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Hoàn tạm ứng thất bại'), 'error');
    } finally {
      setIsBusy(false);
    }
    return;
  };

  /** Đóng modal xác nhận rồi ủy quyền cleanup phiên/redirect cho lớp auth dùng chung. */
  const handleConfirmLogout = () => {
    setIsLogoutOpen(false);
    void performLogout();
  };

  /**
   * Xuất snapshot report hiện tại thành CSV UTF-8 có BOM để mở đúng tiếng Việt.
   * Guard summary rỗng ngăn file không có dữ liệu; mỗi cell được escape để mã nhận diện không bị
   * spreadsheet diễn giải thành công thức. Đây là side effect tải file, không thay đổi report server.
   */
  const handleExportReport = () => {
    if (!reportSummary) {
      showToast('Chưa có dữ liệu báo cáo để xuất.', 'error');
      return;
    }
    const rows = [
      ['Mã giao dịch', 'Mã bệnh nhân', 'Loại', 'Phương thức', 'Số tiền', 'Thời gian'],
      ...reportLogs.map((log) => [
        log.id,
        log.patientCode,
        log.type,
        log.method,
        String(log.amount),
        log.time,
      ]),
    ];
    const csv = rows
      .map((row) => row.map(toSafeCsvCell).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-ca-${reportFromDate}-${reportToDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất báo cáo ca trực.');
  };

  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:overflow-hidden h-screen w-full bg-[#f6fafe] font-['Be_Vietnam_Pro'] select-none">
      <AccountingSidebar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        onLogoutClick={() => setIsLogoutOpen(true)}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <AccountingHeader activeScreen={activeScreen} patientCount={patients.length} />

        <main className="flex-1 overflow-y-auto p-6 bg-[#f6fafe]">
          {isRedirectingMomo ? (
            <div className="mb-4 rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-4 py-3 text-sm text-fuchsia-900">
              Đang chuyển sang cổng thanh toán Momo Sandbox (QR / ví / ATM / Visa / Mastercard)…
              {momoPayUrl ? (
                <div className="mt-2">
                  <a className="underline font-semibold" href={momoPayUrl} rel="noreferrer">
                    Bấm vào đây nếu trình duyệt không tự chuyển
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeScreen === 's1' && (
            <PatientLookupScreen
              patients={patients}
              isLoading={isPatientsLoading}
              errorMessage={patientsError}
              onSelectPatientForInvoice={handleSelectPatientForInvoice}
              onRefresh={() => void loadPendingFromApi()}
            />
          )}

          {activeScreen === 's2' && selectedPatient && (
            <InvoiceCreationScreen
              patient={selectedPatient}
              onProceedToPayment={handleProceedToPayment}
              onOpenExistingInvoice={(invoiceId) => void openInvoiceFromApi(invoiceId)}
              onBack={() => setActiveScreen('s1')}
            />
          )}

          {activeScreen === 's3' && selectedPatient && currentInvoice && (
            <PaymentStatementScreen
              patient={selectedPatient}
              invoice={currentInvoice}
              onOpenCashModal={() => setIsCashOpen(true)}
              onOpenMomoModal={() => {
                void handleOpenMomo();
              }}
              onOpenCancelModal={() => setIsCancelOpen(true)}
              onOpenWriteoffModal={() => setIsWriteoffOpen(true)}
              onBack={() => setActiveScreen('s1')}
            />
          )}

          {/* Callback thu tạm ứng gửi mutation rồi tải lại summary cho đúng record đang chọn. */}
          {activeScreen === 's4' && (
            <AdvanceManagementScreen
              patients={patients}
              summary={advanceSummary}
              isLoading={isAdvanceLoading}
              isSubmitting={isBusy}
              onPatientChange={(patient) => setSelectedPatient(patient)}
              onCreateDeposit={async (input) => {
                setIsBusy(true);
                try {
                  await createPaymentAdvance(input.recordId, {
                    amountVnd: input.amountVnd,
                    method: input.method,
                    ...(input.reason ? { reason: input.reason } : {}),
                  });
                  await loadAdvanceSummary(input.recordId);
                  showToast('Đã lưu giao dịch tạm ứng.');
                } catch (error) {
                  showToast(getApiErrorMessage(error, 'Thu tạm ứng thất bại'), 'error');
                } finally {
                  setIsBusy(false);
                }
              }}
              onOpenRefundModal={() => setIsRefundOpen(true)}
            />
          )}

          {activeScreen === 's5' && (
            <ShiftReportScreen
              summary={reportSummary}
              logs={reportLogs}
              onExportReport={handleExportReport}
              fromDate={reportFromDate}
              toDate={reportToDate}
              isLoading={isReportLoading}
              errorMessage={reportError}
              onDateChange={({ from, to }) => {
                setReportFromDate(from);
                setReportToDate(to);
              }}
            />
          )}
        </main>
      </div>

      {currentInvoice && selectedPatient ? (
        <>
          <CashPaymentModal
            isOpen={isCashOpen}
            amount={currentInvoice.finalAmount}
            invoiceNumber={currentInvoice.invoiceNumber}
            patientName={selectedPatient.fullName}
            onClose={() => setIsCashOpen(false)}
            onConfirmSuccess={handleCashConfirm}
          />

          {/* Fallback khi redirect bị chặn; callback vẫn sync status qua backend trước khi đóng modal. */}
          <MomoQrModal
            isOpen={isMomoOpen}
            amount={currentInvoice.finalAmount}
            invoiceNumber={currentInvoice.invoiceNumber}
            patientName={selectedPatient.fullName}
            payUrl={momoPayUrl}
            qrPayload={momoPayUrl}
            statusText="Mở trang Momo để chọn QR / ATM / Visa / Mastercard"
            onClose={() => setIsMomoOpen(false)}
            onConfirmSuccess={async () => {
              if (apiInvoiceId) {
                await syncMomoPayment(apiInvoiceId);
                const dto = await getInvoice(apiInvoiceId);
                setCurrentInvoice(mapApiInvoiceToView(dto, selectedPatient));
                if (dto.status === 'paid') {
                  applyPaidUi();
                  showToast('Đã đồng bộ thanh toán MoMo.');
                }
              }
              setIsMomoOpen(false);
            }}
          />

          <CancelInvoiceModal
            isOpen={isCancelOpen}
            invoiceNumber={currentInvoice.invoiceNumber}
            onClose={() => setIsCancelOpen(false)}
            onConfirmCancel={(reason) => {
              void handleCancelInvoice(reason);
            }}
          />

          <WriteoffModal
            isOpen={isWriteoffOpen}
            invoiceNumber={currentInvoice.invoiceNumber}
            onClose={() => setIsWriteoffOpen(false)}
            onConfirmWriteoff={(reason) => void handleWriteoff(reason)}
          />
        </>
      ) : null}

      <RefundModal
        isOpen={isRefundOpen}
        amount={advanceSummary ? moneyToNumber(advanceSummary.balance) : 0}
        patientName={selectedPatient?.fullName ?? ''}
        patientCode={selectedPatient?.code ?? ''}
        onClose={() => setIsRefundOpen(false)}
        onConfirmRefund={(reason) => void handleRefundSuccess(reason)}
      />

      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirmLogout={handleConfirmLogout}
      />

      <AppToast centered message={notification.message} onClose={hideToast} tone={notification.tone} />
    </div>
  );
}
