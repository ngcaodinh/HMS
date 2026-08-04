'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getApiErrorCode, getApiErrorMessage } from '@/shared/api-client/api-client';
import { performLogout } from '@/shared/auth/logout';
import { AppToast } from '@/shared/components/app-toast';

import { AccountingScreenId, Invoice, PatientRecord } from '../../types/invoice.types';
import { AccountingHeader } from '../../components/accounting-header';
import { AccountingSidebar } from '../../components/accounting-sidebar';
import { PatientLookupScreen } from '../../components/patient-lookup-screen';
import { InvoiceCreationScreen } from '../../components/invoice-creation-screen';
import { PaymentStatementScreen } from '../../components/payment-statement-screen';
import { AdvanceManagementScreen } from '../../components/advance-management-screen';
import { ShiftReportScreen } from '../../components/shift-report-screen';
import { CashPaymentModal } from '../../components/modals/cash-payment-modal';
import { MomoQrModal } from '../../components/modals/momo-qr-modal';
import { CancelInvoiceModal } from '../../components/modals/cancel-invoice-modal';
import { WriteoffModal } from '../../components/modals/writeoff-modal';
import { RefundModal } from '../../components/modals/refund-modal';
import { LogoutModal } from '../../components/modals/logout-modal';
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

const SS_INVOICE = 'hms_momo_invoice_id';
const SS_ORDER = 'hms_momo_order_id';

function moneyToNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mapInvoiceItemCategory(category: string): Invoice['items'][number]['category'] {
  if (category === 'consultation') return 'khambenh';
  if (category === 'lab') return 'xetnghiem';
  if (category === 'medicine') return 'thuoc';
  if (category === 'procedure') return 'phauthuat';
  return 'khac';
}

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
      bhytCoverRate: item.coveredByHealthInsurance ? 0.8 : 0,
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
    status: dto.status === 'paid' ? 'settled' : 'pending_payment',
    depositAmount: moneyToNumber(dto.advanceAppliedAmount),
    totalServicesAmount: moneyToNumber(dto.subtotal),
    bhytTotalPays: moneyToNumber(dto.healthInsuranceDiscountAmount),
    patientCoPayAmount: moneyToNumber(dto.amountDue),
    remainingAmount: dto.status === 'paid' ? 0 : moneyToNumber(dto.amountDue),
    healthInsuranceExpiryDate: fallback?.healthInsuranceExpiryDate ?? null,
    treatmentType: dto.patient?.treatmentType,
    bedId: dto.patient?.bedId,
    isEmergency: fallback?.isEmergency,
  };
}

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
  const pendingLoadSequenceRef = useRef(0);
  const advanceLoadSequenceRef = useRef(0);

  const [isCashOpen, setIsCashOpen] = useState(false);
  const [isMomoOpen, setIsMomoOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isWriteoffOpen, setIsWriteoffOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    tone: 'success' | 'error';
  } | null>(null);
  const notificationTimerRef = useRef<number | null>(null);

  /** Hiển thị thông báo dùng chung của HMS và tự đóng sau một khoảng thời gian ngắn. */
  const showToast = useCallback((msg: string, tone: 'success' | 'error' = 'success') => {
    if (notificationTimerRef.current !== null) {
      window.clearTimeout(notificationTimerRef.current);
    }
    setNotification({ message: msg, tone });
    notificationTimerRef.current = window.setTimeout(() => {
      setNotification(null);
      notificationTimerRef.current = null;
    }, 4500);
  }, []);

  useEffect(
    () => () => {
      if (notificationTimerRef.current !== null) {
        window.clearTimeout(notificationTimerRef.current);
      }
    },
    [],
  );

  /** Nạp danh sách hồ sơ và hóa đơn từ backend; lỗi được phản hồi rõ ràng thay vì hiển thị dữ liệu dựng sẵn. */
  const loadPendingFromApi = useCallback(async () => {
    const requestSequence = ++pendingLoadSequenceRef.current;
    setIsPatientsLoading(true);
    setPatientsError(null);
    try {
      const [result, candidates] = await Promise.all([
        listInvoices({ status: 'pending', pageSize: 50 }),
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

  useEffect(() => {
    if (activeScreen !== 's4' || !selectedPatient?.recordId) {
      advanceLoadSequenceRef.current += 1;
      setAdvanceSummary(null);
      setIsAdvanceLoading(false);
      return;
    }
    void loadAdvanceSummary(selectedPatient.recordId);
  }, [activeScreen, loadAdvanceSummary, selectedPatient?.recordId]);

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

  // Load pending + xử lý return từ trang Momo (redirectUrl)
  useEffect(() => {
    void loadPendingFromApi();

    const params = new URLSearchParams(window.location.search);
    const momoReturn = params.get('momo') === 'return';
    const invoiceIdFromUrl = params.get('invoiceId');
    const storedId = sessionStorage.getItem(SS_INVOICE);
    // Resume khi Momo redirect về, hoặc URL mang invoiceId sau thanh toán.
    const resumeId = momoReturn || invoiceIdFromUrl ? invoiceIdFromUrl || storedId : null;

    if (!resumeId) {
      return;
    }

    let cancelled = false;
    let attempts = 0;

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
        showToast('Thanh toán Momo thành công — hóa đơn đã được lưu trên hệ thống');
        void loadPendingFromApi();
      }
    };

    const poll = async () => {
      try {
        await syncMomoPayment(resumeId);
        const status = await getInvoice(resumeId);
        if (status.status === 'paid') {
          await finishPaid(resumeId);
          return;
        }
      } catch {
        // tiếp tục poll
      }
      attempts += 1;
      if (attempts < 20 && !cancelled) {
        window.setTimeout(() => {
          void poll();
        }, 2500);
      } else if (!cancelled) {
        await finishPaid(resumeId);
        showToast('Chưa nhận IPN Momo — kiểm tra tunnel IPN hoặc bấm tải lại hóa đơn', 'error');
      }
    };

    showToast('Đang xác nhận thanh toán Momo…');
    void poll();

    return () => {
      cancelled = true;
    };
  }, [loadPendingFromApi, showToast]);

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

  const handleProceedToPayment = (dto: InvoiceApiDto) => {
    if (!selectedPatient) {
      showToast('Không xác định được hồ sơ bệnh nhân để mở thanh toán.', 'error');
      return;
    }
    setApiInvoiceId(dto.invoiceId);
    setApiInvoiceVersion(dto.version);
    setCurrentInvoice(mapApiInvoiceToView(dto, selectedPatient));
    setActiveScreen('s3');
  };

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

  const handleCashConfirm = async () => {
    if (!selectedPatient || !apiInvoiceId) {
      showToast('Hóa đơn chưa được khởi tạo trên hệ thống — vui lòng lập lại hóa đơn.', 'error');
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
      showToast(`Thu tiền mặt OK · Phiếu ${result.receiptNumber}`);
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Thu tiền mặt thất bại'), 'error');
    }
  };

  /**
   * Tạo Momo request → redirect full-page sang cổng Momo Sandbox (`payUrl`).
   * requestType payWithMethod: quét QR + ví MoMo + ATM + Visa/Mastercard trên trang Momo.
   */
  const handleOpenMomo = async () => {
    if (!apiInvoiceId) {
      showToast('Cần hóa đơn đã lưu trên hệ thống để thanh toán Momo.', 'error');
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
      showToast('Đang chuyển sang cổng thanh toán Momo…');
      // Trang Momo: QR / ví / ATM / Visa / Mastercard (payWithMethod)
      window.location.href = momo.payUrl;
    } catch (error) {
      setIsRedirectingMomo(false);
      setIsMomoOpen(false);
      showToast(
        getApiErrorMessage(
          error,
          'Tạo thanh toán Momo thất bại — kiểm tra USE_MOMO_MOCK=false và credential sandbox',
        ),
        'error',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleCancelInvoice = async (reason: string) => {
    if (!apiInvoiceId) {
      showToast(
        'Hóa đơn chưa được khởi tạo trên hệ thống — vui lòng lập lại hóa đơn trước khi hủy.',
        'error',
      );
      return;
    }
    try {
      await cancelInvoice(apiInvoiceId, {
        expectedVersion: apiInvoiceVersion,
        cancelReason: reason,
      });
      showToast(`Đã hủy hóa đơn. Lý do: ${reason}`);
      void loadPendingFromApi();
    } catch (error) {
      if (
        getApiErrorCode(error) === 'VERSION_CONFLICT' ||
        getApiErrorCode(error) === 'INVOICE_NOT_PENDING'
      ) {
        void openInvoiceFromApi(apiInvoiceId);
        showToast('Hóa đơn đã thay đổi; hệ thống đã tải lại dữ liệu mới nhất.', 'error');
        return;
      }
      showToast(getApiErrorMessage(error, 'Hủy hóa đơn thất bại'), 'error');
      return;
    }
    setIsCancelOpen(false);
    setApiInvoiceId(null);
    setActiveScreen('s1');
  };

  const handleWriteoff = async (reason: string) => {
    if (!apiInvoiceId) {
      showToast('Hóa đơn chưa được khởi tạo trên hệ thống — vui lòng lập lại hóa đơn.', 'error');
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
      showToast('Đã ghi nhận write-off cấp cứu trên hệ thống.');
      return;
    } catch (error) {
      if (getApiErrorCode(error) === 'INVOICE_NOT_PENDING') {
        void openInvoiceFromApi(apiInvoiceId);
      }
      showToast(getApiErrorMessage(error, 'Ghi nhận write-off thất bại'), 'error');
      return;
    }
  };

  const handleRefundSuccess = async (reason: string) => {
    if (!selectedPatient) {
      showToast('Chưa chọn hồ sơ bệnh nhân để hoàn tạm ứng.', 'error');
      return;
    }
    const recordId = selectedPatient.recordId;
    const amount = advanceSummary ? moneyToNumber(advanceSummary.balance) : 0;
    if (!recordId || amount <= 0) {
      showToast('Không có số dư tạm ứng để hoàn trả.');
      return;
    }
    setIsBusy(true);
    try {
      await createPaymentAdvanceRefund(recordId, { amountVnd: amount, reason });
      await loadAdvanceSummary(recordId);
      setIsRefundOpen(false);
      showToast(`Đã hoàn ${amount.toLocaleString('vi-VN')} đ cho BN ${selectedPatient.fullName}.`);
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Hoàn tạm ứng thất bại'), 'error');
    } finally {
      setIsBusy(false);
    }
    return;
  };

  const handleConfirmLogout = () => {
    setIsLogoutOpen(false);
    void performLogout();
  };

  const handleExportReport = () => {
    showToast('Chưa có API báo cáo ca trực để xuất dữ liệu.', 'error');
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
                  showToast('Đã lưu giao dịch tạm ứng trên hệ thống.');
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
            <ShiftReportScreen summary={null} logs={[]} onExportReport={handleExportReport} />
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

          {/* Fallback hiếm khi redirect bị chặn — vẫn có link payUrl */}
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
                  showToast('Đã đồng bộ thanh toán Momo');
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

      <AppToast centered message={notification?.message ?? null} tone={notification?.tone} />
    </div>
  );
}
