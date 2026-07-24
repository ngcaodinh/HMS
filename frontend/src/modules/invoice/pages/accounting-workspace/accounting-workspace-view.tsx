'use client';

import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/shared/api-client/api-client';

import { USE_REAL_BILLING } from '../../constants/billing.constants';
import {
  MOCK_ADVANCE_RECEIPTS,
  MOCK_INVOICE_DETAILS,
  MOCK_SHIFT_SUMMARY,
  MOCK_TRANSACTION_LOGS,
  PATIENTS_DB,
} from '../../data/mock-accounting-data';
import {
  AccountingScreenId,
  AdvanceReceipt,
  Invoice,
  PatientRecord,
} from '../../types/invoice.types';
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
  listInvoices,
  type InvoiceApiDto,
} from '../../services/invoice.api';
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

function mapApiInvoiceToView(dto: InvoiceApiDto, patient?: PatientRecord | null): Invoice {
  const fullName = dto.patient?.fullName ?? patient?.fullName ?? 'Bệnh nhân';
  return {
    id: dto.invoiceId,
    invoiceNumber: dto.invoiceId.slice(0, 8).toUpperCase(),
    patientId: dto.patient?.patientId ?? patient?.id ?? '',
    patientName: fullName,
    createdAt: new Date().toISOString(),
    status:
      dto.status === 'paid'
        ? 'paid'
        : dto.status === 'cancelled'
          ? 'cancelled'
          : 'pending_payment',
    items: dto.items.map((item, index) => ({
      id: item.invoiceItemId,
      code: `DV-${index + 1}`,
      name: item.description,
      category: 'khambenh',
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
      dto.paymentMethod === 'momo'
        ? 'momo'
        : dto.paymentMethod === 'cash'
          ? 'cash'
          : undefined,
  };
}

function mapInvoiceToPatient(dto: InvoiceApiDto): PatientRecord {
  return {
    id: dto.patient?.patientId ?? dto.recordId,
    code: dto.patient?.patientCode ?? '—',
    fullName: dto.patient?.fullName ?? 'Bệnh nhân',
    dob: '—',
    gender: 'Nam',
    bhytCardNumber: '—',
    bhytBenefitRate: 0.8,
    bhytCategory: 'Theo hóa đơn',
    department: 'Da liễu',
    admissionDate: '—',
    status: dto.status === 'paid' ? 'settled' : 'pending_payment',
    depositAmount: 0,
    totalServicesAmount: moneyToNumber(dto.subtotal),
    bhytTotalPays: moneyToNumber(dto.healthInsuranceDiscountAmount),
    patientCoPayAmount: moneyToNumber(dto.amountDue),
    remainingAmount: dto.status === 'paid' ? 0 : moneyToNumber(dto.amountDue),
  };
}

export function AccountingWorkspaceView() {
  const [activeScreen, setActiveScreen] = useState<AccountingScreenId>('s1');
  const [patients, setPatients] = useState<PatientRecord[]>(PATIENTS_DB);
  const [advanceReceipts] = useState<AdvanceReceipt[]>(MOCK_ADVANCE_RECEIPTS);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord>(PATIENTS_DB[0]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(MOCK_INVOICE_DETAILS);
  const [apiInvoiceId, setApiInvoiceId] = useState<string | null>(null);
  const [apiInvoiceVersion, setApiInvoiceVersion] = useState(1);
  const [pendingInvoices, setPendingInvoices] = useState<InvoiceApiDto[]>([]);
  const [momoPayUrl, setMomoPayUrl] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isRedirectingMomo, setIsRedirectingMomo] = useState(false);

  const [isCashOpen, setIsCashOpen] = useState(false);
  const [isMomoOpen, setIsMomoOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isWriteoffOpen, setIsWriteoffOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 4500);
  }, []);

  const loadPendingFromApi = useCallback(async () => {
    if (!USE_REAL_BILLING) {
      return;
    }
    try {
      const result = await listInvoices({ status: 'pending', pageSize: 50 });
      setPendingInvoices(result.items);
      const mapped = result.items.map(mapInvoiceToPatient);
      if (mapped.length > 0) {
        setPatients(mapped);
      }
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không tải được danh sách hóa đơn chờ thu'));
    }
  }, [showToast]);

  const openInvoiceFromApi = useCallback(
    async (invoiceId: string) => {
      setIsBusy(true);
      try {
        const dto = await getInvoice(invoiceId);
        const patient = mapInvoiceToPatient(dto);
        setSelectedPatient(patient);
        setApiInvoiceId(dto.invoiceId);
        setApiInvoiceVersion(dto.version);
        setCurrentInvoice(mapApiInvoiceToView(dto, patient));
        setActiveScreen('s3');
      } catch (error) {
        showToast(getApiErrorMessage(error, 'Không mở được hóa đơn'));
      } finally {
        setIsBusy(false);
      }
    },
    [showToast],
  );

  // Load pending + xử lý return từ trang Momo (redirectUrl)
  useEffect(() => {
    if (!USE_REAL_BILLING) {
      return;
    }

    void loadPendingFromApi();

    const params = new URLSearchParams(window.location.search);
    const momoReturn = params.get('momo') === 'return';
    const invoiceIdFromUrl = params.get('invoiceId');
    const storedId = sessionStorage.getItem(SS_INVOICE);
    // Resume khi Momo redirect về, hoặc URL mang invoiceId sau thanh toán.
    const resumeId =
      momoReturn || invoiceIdFromUrl ? invoiceIdFromUrl || storedId : null;

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
        showToast('Thanh toán Momo thành công — hóa đơn đã được lưu paid');
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
        showToast('Chưa nhận IPN Momo — kiểm tra tunnel IPN hoặc bấm tải lại HĐ');
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
    // Real mode: mở HĐ pending tương ứng patient
    if (USE_REAL_BILLING) {
      const match = pendingInvoices.find(
        (inv) =>
          inv.patient?.patientCode === patient.code || inv.patient?.patientId === patient.id,
      );
      if (match) {
        void openInvoiceFromApi(match.invoiceId);
        return;
      }
    }
    setActiveScreen('s2');
  };

  const handleSelectPatientForAdvance = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setActiveScreen('s4');
  };

  const handleProceedToPayment = (inv: Invoice) => {
    setCurrentInvoice(inv);
    setActiveScreen('s3');
  };

  const applyPaidUi = () => {
    setPatients((prev) =>
      prev.map((p) =>
        p.code === selectedPatient.code ? { ...p, status: 'settled', remainingAmount: 0 } : p,
      ),
    );
    setSelectedPatient((prev) => ({
      ...prev,
      status: 'settled',
      remainingAmount: 0,
    }));
    setCurrentInvoice((prev) => ({
      ...prev,
      status: 'paid',
    }));
    setActiveScreen('s3');
    void loadPendingFromApi();
  };

  const handleCashConfirm = async () => {
    if (!USE_REAL_BILLING || !apiInvoiceId) {
      setIsCashOpen(false);
      applyPaidUi();
      showToast(`Đã thu tiền (mock) cho BN ${selectedPatient.fullName}.`);
      return;
    }
    try {
      const result = await settleCashPayment(apiInvoiceId);
      const refreshed = await getInvoice(apiInvoiceId);
      setApiInvoiceVersion(refreshed.version);
      setCurrentInvoice(mapApiInvoiceToView(refreshed, selectedPatient));
      setIsCashOpen(false);
      applyPaidUi();
      showToast(`Thu tiền mặt OK · Phiếu ${result.receiptNumber}`);
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Thu tiền mặt thất bại'));
    }
  };

  /**
   * Tạo Momo request → redirect full-page sang cổng Momo Sandbox (`payUrl`).
   * requestType payWithMethod: quét QR + ví MoMo + ATM + Visa/Mastercard trên trang Momo.
   */
  const handleOpenMomo = async () => {
    if (!USE_REAL_BILLING || !apiInvoiceId) {
      showToast('Cần hóa đơn API thật để thanh toán Momo Sandbox');
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
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleCancelInvoice = async (reason: string) => {
    if (USE_REAL_BILLING && apiInvoiceId) {
      try {
        await cancelInvoice(apiInvoiceId, {
          expectedVersion: apiInvoiceVersion,
          cancelReason: reason,
        });
        showToast(`Đã hủy hóa đơn. Lý do: ${reason}`);
        void loadPendingFromApi();
      } catch (error) {
        showToast(getApiErrorMessage(error, 'Hủy hóa đơn thất bại'));
        return;
      }
    } else {
      showToast(`Đã hủy hóa đơn ${currentInvoice.invoiceNumber}. Lý do: ${reason}`);
    }
    setIsCancelOpen(false);
    setApiInvoiceId(null);
    setActiveScreen('s1');
  };

  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:overflow-hidden h-screen w-full bg-[#f6fafe] font-['Be_Vietnam_Pro'] select-none">
      <AccountingSidebar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        onLogoutClick={() => setIsLogoutOpen(true)}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <AccountingHeader
          activeScreen={activeScreen}
          patientCount={
            USE_REAL_BILLING
              ? pendingInvoices.length
              : patients.filter((p) => p.status === 'pending_payment').length
          }
        />

        <main className="flex-1 overflow-y-auto p-6 bg-[#f6fafe]">
          {USE_REAL_BILLING ? (
            <div className="mb-4 space-y-2 rounded-xl border border-[#91c5ee] bg-[#e8f4fd] px-4 py-3 text-[13px] text-[#006096]">
              <div className="flex flex-wrap items-center gap-2">
                <strong>API + DB</strong>
                <button
                  className="rounded-lg border border-[#006096] px-3 py-1 text-xs font-bold hover:bg-white disabled:opacity-50"
                  disabled={isBusy}
                  onClick={() => {
                    void loadPendingFromApi();
                  }}
                  type="button"
                >
                  Tải lại HĐ chờ thu
                </button>
                <span className="text-[11px] text-[#48626e]">
                  {pendingInvoices.length} hóa đơn pending · Momo → trang sandbox (QR / ATM / thẻ)
                </span>
              </div>
              {pendingInvoices.length > 0 ? (
                <ul className="max-h-28 space-y-1 overflow-auto text-[12px]">
                  {pendingInvoices.map((inv) => (
                    <li key={inv.invoiceId}>
                      <button
                        className="text-left font-mono text-[#00527f] underline"
                        onClick={() => {
                          void openInvoiceFromApi(inv.invoiceId);
                        }}
                        type="button"
                      >
                        {inv.patient?.patientCode ?? '—'} · {inv.patient?.fullName ?? '—'} ·{' '}
                        {inv.amountDue} đ · {inv.invoiceId.slice(0, 8)}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-[#48626e]">
                  Chưa có HĐ pending. Chạy seed:{' '}
                  <code className="font-mono">npx tsx prisma/seeders/seed-billing-payment-demo.ts</code>
                </p>
              )}
            </div>
          ) : (
            <div className="mb-4 rounded-xl border border-[#e0e0e0] bg-[#f5f5f5] px-4 py-2 text-[12px] text-[#707882]">
              Mock UI. Bật API: <code>NEXT_PUBLIC_USE_REAL_BILLING=true</code>
            </div>
          )}

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
              onSelectPatientForInvoice={handleSelectPatientForInvoice}
              onSelectPatientForAdvance={handleSelectPatientForAdvance}
            />
          )}

          {activeScreen === 's2' && (
            <InvoiceCreationScreen
              patient={selectedPatient}
              invoice={currentInvoice}
              onProceedToPayment={handleProceedToPayment}
              onBack={() => setActiveScreen('s1')}
            />
          )}

          {activeScreen === 's3' && (
            <PaymentStatementScreen
              patient={selectedPatient}
              invoice={currentInvoice}
              onOpenCashModal={() => setIsCashOpen(true)}
              onOpenMomoModal={() => {
                void handleOpenMomo();
              }}
              onOpenCancelModal={() => setIsCancelOpen(true)}
              onOpenWriteoffModal={() => setIsWriteoffOpen(true)}
              onConfirmSuccess={() => {
                void handleCashConfirm();
              }}
              onBack={() => setActiveScreen('s1')}
            />
          )}

          {activeScreen === 's4' && (
            <AdvanceManagementScreen
              patients={patients}
              receipts={advanceReceipts}
              onOpenAdvanceModal={() => showToast('Tạm ứng API — phase sau.')}
              onOpenRefundModal={() => setIsRefundOpen(true)}
            />
          )}

          {activeScreen === 's5' && (
            <ShiftReportScreen
              summary={MOCK_SHIFT_SUMMARY}
              logs={MOCK_TRANSACTION_LOGS}
              onExportReport={() => showToast('Xuất báo cáo (mock).')}
            />
          )}
        </main>
      </div>

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
        onConfirmWriteoff={(reason) => {
          setIsWriteoffOpen(false);
          showToast(`Write-off demo: ${reason}`);
        }}
      />

      <RefundModal
        isOpen={isRefundOpen}
        amount={800000}
        patientName={selectedPatient.fullName}
        patientCode={selectedPatient.code}
        onClose={() => setIsRefundOpen(false)}
        onConfirmRefund={() => {
          setIsRefundOpen(false);
          showToast('Hoàn tạm ứng (mock)');
        }}
      />

      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirmLogout={() => {
          setIsLogoutOpen(false);
          showToast('Đã đăng xuất (mock)');
        }}
      />

      {toastMessage ? (
        <div className="fixed bottom-6 right-6 z-[60] max-w-md rounded-xl bg-[#001d32] px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
