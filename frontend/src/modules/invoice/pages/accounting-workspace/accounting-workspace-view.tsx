'use client';

import { useState } from 'react';
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

export function AccountingWorkspaceView() {
  const [activeScreen, setActiveScreen] = useState<AccountingScreenId>('s1');
  const [patients, setPatients] = useState<PatientRecord[]>(PATIENTS_DB);
  const [advanceReceipts] = useState<AdvanceReceipt[]>(MOCK_ADVANCE_RECEIPTS);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord>(PATIENTS_DB[0]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(MOCK_INVOICE_DETAILS);

  // Modal Visibility States
  const [isCashOpen, setIsCashOpen] = useState<boolean>(false);
  const [isMomoOpen, setIsMomoOpen] = useState<boolean>(false);
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);
  const [isWriteoffOpen, setIsWriteoffOpen] = useState<boolean>(false);
  const [isRefundOpen, setIsRefundOpen] = useState<boolean>(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSelectPatientForInvoice = (patient: PatientRecord) => {
    setSelectedPatient(patient);
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

  const handlePaymentSuccess = () => {
    setIsCashOpen(false);
    setIsMomoOpen(false);

    // Update patient status to 'settled' in patients list
    setPatients((prev) =>
      prev.map((p) =>
        p.code === selectedPatient.code ? { ...p, status: 'settled', remainingAmount: 0 } : p,
      ),
    );

    // Update selected patient state
    setSelectedPatient((prev) => ({
      ...prev,
      status: 'settled',
      remainingAmount: 0,
    }));

    // Update current invoice status to 'paid'
    setCurrentInvoice((prev) => ({
      ...prev,
      status: 'paid',
    }));

    showToast(
      `Đã thu tiền và xuất Bảng kê chi phí khám chữa bệnh thành công cho BN ${selectedPatient.fullName}.`,
    );

    // Keep user on Screen 3 to view "ĐÃ THANH TOÁN" watermark stamp
    setActiveScreen('s3');
  };

  const handleCancelInvoice = (reason: string) => {
    setIsCancelOpen(false);
    setPatients((prev) =>
      prev.map((p) => (p.code === selectedPatient.code ? { ...p, status: 'refunded' } : p)),
    );
    showToast(`Đã hủy hóa đơn ${currentInvoice.invoiceNumber}. Lý do: ${reason}`);
    setActiveScreen('s1');
  };

  const handleWriteoff = (reason: string) => {
    setIsWriteoffOpen(false);
    showToast(
      `Đã duyệt Write-off cấp cứu cho hóa đơn ${currentInvoice.invoiceNumber}. Lý do: ${reason}`,
    );
    setActiveScreen('s1');
  };

  const handleRefundSuccess = (reason: string) => {
    setIsRefundOpen(false);
    showToast(
      `Đã hoàn trả 800.000 đ tiền tạm ứng dư cho BN ${selectedPatient.fullName}. Lý do: ${reason}`,
    );
  };

  const handleConfirmLogout = () => {
    setIsLogoutOpen(false);
    showToast('Đã kết thúc ca trực và đăng xuất hệ thống thành công.');
  };

  const handleExportReport = () => {
    showToast('Đã xuất báo cáo tổng hợp tài chính ca trực (File BKT_20260720.xlsx).');
  };

  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:overflow-hidden h-screen w-full bg-[#f6fafe] font-['Be_Vietnam_Pro'] select-none">
      {/* System-wide HMS Sidebar */}
      <AccountingSidebar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        onLogoutClick={() => setIsLogoutOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header matching doc/ke_toan copy.html */}
        <AccountingHeader
          activeScreen={activeScreen}
          patientCount={patients.filter((p) => p.status === 'pending_payment').length}
        />

        {/* Screen Content Panels matching doc/ke_toan copy.html */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f6fafe]">
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
              onOpenMomoModal={() => setIsMomoOpen(true)}
              onOpenCancelModal={() => setIsCancelOpen(true)}
              onOpenWriteoffModal={() => setIsWriteoffOpen(true)}
              onConfirmSuccess={handlePaymentSuccess}
              onBack={() => setActiveScreen('s1')}
            />
          )}

          {activeScreen === 's4' && (
            <AdvanceManagementScreen
              patients={patients}
              receipts={advanceReceipts}
              onOpenAdvanceModal={() => showToast('Chức năng lập phiếu thu tạm ứng đã sẵn sàng.')}
              onOpenRefundModal={() => setIsRefundOpen(true)}
            />
          )}

          {activeScreen === 's5' && (
            <ShiftReportScreen
              summary={MOCK_SHIFT_SUMMARY}
              logs={MOCK_TRANSACTION_LOGS}
              onExportReport={handleExportReport}
            />
          )}
        </main>
      </div>

      {/* 1. Cash Payment Modal */}
      <CashPaymentModal
        isOpen={isCashOpen}
        amount={currentInvoice.finalAmount}
        invoiceNumber={currentInvoice.invoiceNumber}
        patientName={selectedPatient.fullName}
        onClose={() => setIsCashOpen(false)}
        onConfirmSuccess={handlePaymentSuccess}
      />

      {/* 2. MoMo QR Modal */}
      <MomoQrModal
        isOpen={isMomoOpen}
        amount={currentInvoice.finalAmount}
        invoiceNumber={currentInvoice.invoiceNumber}
        patientName={selectedPatient.fullName}
        onClose={() => setIsMomoOpen(false)}
        onConfirmSuccess={handlePaymentSuccess}
      />

      {/* 3. Cancel Invoice Modal */}
      <CancelInvoiceModal
        isOpen={isCancelOpen}
        invoiceNumber={currentInvoice.invoiceNumber}
        onClose={() => setIsCancelOpen(false)}
        onConfirmCancel={handleCancelInvoice}
      />

      {/* 4. Write-off Modal */}
      <WriteoffModal
        isOpen={isWriteoffOpen}
        invoiceNumber={currentInvoice.invoiceNumber}
        onClose={() => setIsWriteoffOpen(false)}
        onConfirmWriteoff={handleWriteoff}
      />

      {/* 5. Refund Modal */}
      <RefundModal
        isOpen={isRefundOpen}
        amount={800000}
        patientName={selectedPatient.fullName}
        patientCode={selectedPatient.code}
        onClose={() => setIsRefundOpen(false)}
        onConfirmRefund={handleRefundSuccess}
      />

      {/* 6. Logout Modal */}
      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirmLogout={handleConfirmLogout}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-5">
          <svg
            className="h-5 w-5 text-emerald-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
