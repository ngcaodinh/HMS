'use client';

import { useEffect, useMemo, useState } from 'react';

import type { PaymentAdvanceSummaryDto } from '../services/payment-advance.api';
import type { PatientRecord } from '../types/invoice.types';
import {
  formatVndInput,
  parsePositiveVnd,
  sanitizeVndInput,
} from '../utils/payment-advance.validation';

interface AdvanceManagementScreenProps {
  patients: PatientRecord[];
  summary: PaymentAdvanceSummaryDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  onPatientChange: (patient: PatientRecord) => void;
  onCreateDeposit: (input: {
    recordId: string;
    amountVnd: number;
    method: 'cash' | 'momo';
    reason?: string;
  }) => void;
  onOpenRefundModal: () => void;
}

/**
 * Quản lý màn tạm ứng nội trú; số dư và lịch sử luôn lấy từ API, không dùng số hard-code.
 */
export function AdvanceManagementScreen({
  patients,
  summary,
  isLoading,
  isSubmitting,
  onPatientChange,
  onCreateDeposit,
  onOpenRefundModal,
}: AdvanceManagementScreenProps) {
  const inpatientPatients = useMemo(
    () =>
      patients.filter(
        (patient) =>
          patient.treatmentType === 'inpatient' ||
          Boolean(patient.bedId) ||
          patient.department.toLocaleLowerCase('vi-VN').includes('nội trú'),
      ),
    [patients],
  );
  const [activeTab, setActiveTab] = useState<'deposit' | 'refund'>('deposit');
  const [selectedPatientCode, setSelectedPatientCode] = useState('');
  const [advanceInput, setAdvanceInput] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [method, setMethod] = useState<'cash' | 'momo'>('cash');
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    const selectedPatientStillExists = inpatientPatients.some(
      (patient) => patient.code === selectedPatientCode,
    );
    if ((!selectedPatientCode || !selectedPatientStillExists) && inpatientPatients[0]) {
      setSelectedPatientCode(inpatientPatients[0].code);
      onPatientChange(inpatientPatients[0]);
    }
  }, [inpatientPatients, onPatientChange, selectedPatientCode]);

  const currentPatient = inpatientPatients.find((patient) => patient.code === selectedPatientCode);
  const balance = summary ? Number(summary.balance) : 0;

  /** Kiểm tra tiền VND ở FE để phản hồi ngay, server vẫn validate lại khi nhận request. */
  const handleCreateDeposit = () => {
    const amountVnd = parsePositiveVnd(advanceInput);
    if (!amountVnd) {
      setAmountError('Số tiền tạm ứng phải lớn hơn 0.');
      return;
    }
    if (!currentPatient?.recordId) {
      setAmountError('Không xác định được hồ sơ nội trú.');
      return;
    }
    setAmountError(null);
    onCreateDeposit({
      recordId: currentPatient.recordId,
      amountVnd,
      method,
      ...(advanceReason.trim() ? { reason: advanceReason.trim() } : {}),
    });
  };

  const handlePatientChange = (code: string) => {
    setSelectedPatientCode(code);
    const patient = inpatientPatients.find((item) => item.code === code);
    if (patient) onPatientChange(patient);
  };

  return (
    <div className="screen active space-y-4 font-sans select-none animate-fadeIn" id="s4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#171c1f]">Quản lý tạm ứng nội trú</h2>
          <p className="text-[13px] text-[#707882] mt-0.5">
            Thu và hoàn ứng theo từng hồ sơ nội trú.
          </p>
        </div>
        <select
          value={selectedPatientCode}
          onChange={(event) => handlePatientChange(event.target.value)}
          disabled={!inpatientPatients.length}
          aria-label="Chọn bệnh nhân nội trú"
          className="w-80 max-w-full h-10 px-3 border border-[#bfc7d2] rounded-md bg-white text-[13px] font-semibold disabled:bg-[#f0f4f8]"
        >
          {!inpatientPatients.length ? <option value="">Không có hồ sơ nội trú</option> : null}
          {inpatientPatients.map((patient) => (
            <option key={patient.id} value={patient.code}>
              {patient.fullName} ({patient.code}) — {patient.department}
            </option>
          ))}
        </select>
      </div>

      {currentPatient ? (
        <div className="bg-white rounded-xl border border-[#bfc7d2] p-4 shadow-hms-card grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882]">Họ tên</span>
            <strong>{currentPatient.fullName}</strong>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882]">Mã BN</span>
            <span className="font-mono font-bold text-[#006096]">{currentPatient.code}</span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882]">
              Khoa / Buồng
            </span>
            <span>{currentPatient.department}</span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882]">
              Ngày nhập viện
            </span>
            <span>{currentPatient.admissionDate}</span>
          </div>
        </div>
      ) : null}

      <div className="flex border-b-2 border-[#e4e9ed] bg-white rounded-t-xl px-4 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab('deposit')}
          aria-pressed={activeTab === 'deposit'}
          className={`px-5 py-3 text-[13.5px] font-semibold border-b-2 ${
            activeTab === 'deposit'
              ? 'border-[#006096] text-[#006096]'
              : 'border-transparent text-[#707882]'
          }`}
        >
          Thu tạm ứng
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('refund')}
          aria-pressed={activeTab === 'refund'}
          className={`px-5 py-3 text-[13.5px] font-semibold border-b-2 ${
            activeTab === 'refund'
              ? 'border-[#006096] text-[#006096]'
              : 'border-transparent text-[#707882]'
          }`}
        >
          Đối soát & Hoàn trả
        </button>
      </div>

      {activeTab === 'deposit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white rounded-b-xl border border-[#bfc7d2] p-6 shadow-hms-card">
          <div className="space-y-4">
            <h3 className="text-[14px] font-bold border-b border-[#e4e9ed] pb-3">
              Biểu mẫu thu tiền tạm ứng
            </h3>
            <label className="block text-[12px] font-bold text-[#707882]">
              Số tiền tạm ứng (VNĐ) *
              <input
                type="text"
                inputMode="numeric"
                value={formatVndInput(advanceInput)}
                onChange={(event) => setAdvanceInput(sanitizeVndInput(event.target.value))}
                onBlur={() => setAdvanceInput(sanitizeVndInput(advanceInput))}
                aria-invalid={Boolean(amountError)}
                className="mt-1 w-full h-10 px-3 border border-[#bfc7d2] rounded-md font-mono font-bold text-[#171c1f]"
              />
              {amountError ? (
                <span className="mt-1 block text-[12px] font-normal text-[#ba1a1a]">
                  {amountError}
                </span>
              ) : null}
            </label>
            <label className="block text-[12px] font-bold text-[#707882]">
              Phương thức *
              <select
                value={method}
                onChange={(event) => setMethod(event.target.value as 'cash' | 'momo')}
                className="mt-1 w-full h-10 px-3 border border-[#bfc7d2] rounded-md bg-white font-normal text-[#171c1f]"
              >
                <option value="cash">Tiền mặt</option>
                <option value="momo">MoMo</option>
              </select>
            </label>
            <label className="block text-[12px] font-bold text-[#707882]">
              Lý do tạm ứng
              <textarea
                rows={3}
                maxLength={500}
                value={advanceReason}
                onChange={(event) => setAdvanceReason(event.target.value)}
                className="mt-1 w-full p-3 border border-[#bfc7d2] rounded-md font-normal text-[#171c1f]"
              />
            </label>
            <button
              type="button"
              disabled={isSubmitting || !currentPatient}
              onClick={handleCreateDeposit}
              className="w-full py-3 bg-[#006096] text-white rounded-md font-bold text-sm disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? 'Đang lưu giao dịch…' : 'Thu tiền & In phiếu tạm ứng'}
            </button>
          </div>
          <AdvanceHistory summary={summary} isLoading={isLoading} />
        </div>
      ) : (
        <div className="bg-white rounded-b-xl border border-[#bfc7d2] p-6 shadow-hms-card space-y-5">
          <div className="bg-[#d4f4e2] border border-[#a7f0c8] rounded-xl p-5 text-center">
            <div className="text-[28px] font-bold font-mono text-[#1a7a4a]">
              {balance.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[12px] font-bold text-[#1a7a4a]">Số dư tạm ứng có thể hoàn</div>
          </div>
          <button
            type="button"
            disabled={isLoading || isSubmitting || balance <= 0 || !currentPatient}
            onClick={onOpenRefundModal}
            className="w-full py-3 bg-[#1a7a4a] text-white rounded-md font-bold text-sm disabled:opacity-50 min-h-[44px]"
          >
            {balance > 0 ? 'Xác nhận hoàn trả & In phiếu' : 'Không có số dư tạm ứng để hoàn trả'}
          </button>
          <AdvanceHistory summary={summary} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
}

function AdvanceHistory({
  summary,
  isLoading,
}: {
  summary: PaymentAdvanceSummaryDto | null;
  isLoading: boolean;
}) {
  if (isLoading)
    return (
      <div role="status" className="text-sm text-[#707882]">
        Đang tải lịch sử tạm ứng…
      </div>
    );
  if (!summary || summary.items.length === 0)
    return (
      <div role="status" className="text-sm text-[#707882]">
        Chưa có giao dịch tạm ứng.
      </div>
    );

  return (
    <div className="space-y-3">
      <h3 className="text-[14px] font-bold border-b border-[#e4e9ed] pb-3">Lịch sử tạm ứng</h3>
      {summary.items.map((item) => (
        <div
          key={item.id}
          className="p-3 bg-[#f0f4f8] rounded-md border border-[#e4e9ed] flex items-center justify-between gap-3"
        >
          <div>
            <div className="font-mono font-bold text-[13px]">
              {item.receiptNumber ?? item.id.slice(0, 8)}
            </div>
            <div className="text-[11.5px] text-[#707882]">
              {new Date(item.createdAt).toLocaleString('vi-VN')} · {item.reason ?? 'Không có lý do'}
            </div>
          </div>
          <span
            className={`font-mono font-bold text-sm ${item.type === 'deposit' ? 'text-[#1a7a4a]' : 'text-[#ba1a1a]'}`}
          >
            {item.type === 'deposit' ? '+' : '-'} {Number(item.amount).toLocaleString('vi-VN')} đ
          </span>
        </div>
      ))}
      <div className="pt-3 border-t-2 border-[#bfc7d2] flex items-center justify-between">
        <span className="text-[13px] font-bold">Số dư hiện tại</span>
        <span className="font-mono font-bold text-[#006096]">
          {Number(summary.balance).toLocaleString('vi-VN')} đ
        </span>
      </div>
    </div>
  );
}
