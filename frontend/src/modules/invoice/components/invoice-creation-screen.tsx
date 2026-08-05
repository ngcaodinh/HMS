'use client';

import { useState } from 'react';

import {
  getApiErrorCode,
  getApiErrorDetails,
  getApiErrorMessage,
} from '@/shared/api-client/api-client';

import { createInvoice, type InvoiceApiDto } from '../services/invoice.api';
import type { PatientRecord } from '../types/invoice.types';

type BenefitLevel = 'NO_COVERAGE' | 'RATE_80' | 'RATE_95' | 'RATE_100';
type RouteType = 'right_route' | 'referral' | 'emergency' | 'wrong_route';

interface InvoiceCreationScreenProps {
  patient: PatientRecord;
  onProceedToPayment: (invoiceDto: InvoiceApiDto) => void;
  onOpenExistingInvoice: (invoiceId: string) => void;
  onBack: () => void;
}

const benefitOptions: Array<{ value: BenefitLevel; label: string }> = [
  { value: 'NO_COVERAGE', label: 'Không hưởng (0%)' },
  { value: 'RATE_80', label: 'Mức 80%' },
  { value: 'RATE_95', label: 'Mức 95%' },
  { value: 'RATE_100', label: 'Mức 100%' },
];

const routeOptions: Array<{ value: RouteType; label: string }> = [
  { value: 'right_route', label: 'Đúng tuyến' },
  { value: 'referral', label: 'Chuyển tuyến hợp lệ' },
  { value: 'emergency', label: 'Cấp cứu' },
  { value: 'wrong_route', label: 'Trái tuyến' },
];

function getInitialBenefitLevel(
  rate: number,
  hasInsuranceCard: boolean,
  isInsuranceExpired: boolean,
): BenefitLevel {
  if (!hasInsuranceCard || isInsuranceExpired) return 'NO_COVERAGE';
  if (rate >= 1) return 'RATE_100';
  if (rate >= 0.95) return 'RATE_95';
  if (rate > 0) return 'RATE_80';
  return 'NO_COVERAGE';
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}

/**
 * Hiển thị dữ liệu đầu vào và gửi lựa chọn BHYT để server lập hóa đơn.
 * Server là nguồn tính tiền duy nhất; component không tự tính chiết khấu hay số tiền phải trả.
 */
export function InvoiceCreationScreen({
  patient,
  onProceedToPayment,
  onOpenExistingInvoice,
  onBack,
}: InvoiceCreationScreenProps) {
  const serviceItems = patient.serviceItems ?? [];
  const hasInsuranceCard = Boolean(patient.bhytCardNumber && patient.bhytCardNumber !== '—');
  const isInsuranceExpired = patient.healthInsuranceExpiryDate
    ? new Date(patient.healthInsuranceExpiryDate).getTime() < Date.now()
    : true;
  const [benefitLevel, setBenefitLevel] = useState<BenefitLevel>(
    getInitialBenefitLevel(patient.bhytBenefitRate, hasInsuranceCard, isInsuranceExpired),
  );
  const [routeType, setRouteType] = useState<RouteType>('right_route');
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** Gửi request tạo invoice pending; chỉ chuyển màn hình khi backend đã lưu thành công. */
  const handleConfirmInvoice = async () => {
    if (!patient.recordId) {
      setErrorMessage('Hồ sơ chưa có mã hồ sơ hợp lệ để lập hóa đơn trên hệ thống.');
      return;
    }
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const invoiceDto = await createInvoice({
        recordId: patient.recordId,
        healthInsuranceBenefitLevel: benefitLevel,
        ...(benefitLevel === 'NO_COVERAGE' ? {} : { healthInsuranceRouteType: routeType }),
      });
      onProceedToPayment(invoiceDto);
    } catch (error) {
      const existingInvoiceId = getApiErrorDetails(error).find(
        (detail) => detail.field === 'invoiceId' && detail.rule === 'pending_invoice_exists',
      )?.message;
      if (getApiErrorCode(error) === 'INVOICE_ALREADY_EXISTS' && existingInvoiceId) {
        onOpenExistingInvoice(existingInvoiceId);
        return;
      }
      const messages: Record<string, string> = {
        INVOICE_ALREADY_EXISTS:
          'Hồ sơ đã có hóa đơn đang chờ thanh toán. Vui lòng mở hóa đơn hiện tại.',
        INCOMPLETE_COST_DATA:
          'Dịch vụ y tế chưa có đơn giá trong danh mục. Vui lòng liên hệ Admin cập nhật bảng giá.',
        RECORD_NOT_FOUND: 'Không tìm thấy hồ sơ bệnh án để lập hóa đơn.',
      };
      setErrorMessage(
        messages[getApiErrorCode(error) ?? ''] ??
          getApiErrorMessage(error, 'Không thể lập hóa đơn trên hệ thống.'),
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="screen active space-y-4 font-sans select-none animate-fadeIn" id="s2">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#171c1f] leading-tight">
            Lập hóa đơn viện phí
          </h2>
          <p className="text-[13px] text-[#707882] mt-0.5">
            Hồ sơ:{' '}
            <strong className="text-[#171c1f]">
              {patient.code} — {patient.fullName}
            </strong>
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1.5 border border-[#bfc7d2] bg-[#f8fafc] text-[#707882] rounded-md text-[12.5px] font-medium min-h-[36px]"
        >
          ← Quay lại danh sách
        </button>
      </div>

      <section className="bg-white rounded-xl border border-[#bfc7d2] shadow-hms-card overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e4e9ed] flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-[#171c1f]">Thông tin bệnh nhân & Thẻ BHYT</h3>
          <span
            className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
              hasInsuranceCard && !isInsuranceExpired
                ? 'bg-[#d4f4e2] text-[#1a7a4a]'
                : 'bg-[#fff8e1] text-[#a05c00]'
            }`}
          >
            {hasInsuranceCard
              ? isInsuranceExpired
                ? 'Thẻ BHYT hết hạn'
                : 'Thẻ BHYT còn hạn'
              : 'Chưa có thẻ BHYT'}
          </span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882]">
              Họ và tên
            </span>
            <strong>{patient.fullName}</strong>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882]">
              Ngày sinh · Giới tính
            </span>
            <span>
              {patient.dob} · {patient.gender}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882]">
              Số điện thoại
            </span>
            <span className="font-mono">{patient.phoneNumber ?? '—'}</span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882]">
              Số thẻ BHYT
            </span>
            <span className="font-mono font-bold text-[#006096]">{patient.bhytCardNumber}</span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882]">
              Hạn thẻ BHYT
            </span>
            <span>{formatDate(patient.healthInsuranceExpiryDate)}</span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882]">
              Số CCCD
            </span>
            <span className="font-mono">{patient.identityCardNumber ?? '—'}</span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882]">
              Khoa điều trị
            </span>
            <span>{patient.department}</span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882]">
              Mã bệnh nhân
            </span>
            <span className="font-mono font-bold text-[#006096]">{patient.code}</span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase text-[#707882]">
              Ngày khám
            </span>
            <span>{formatDate(patient.admissionDate)}</span>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-[#bfc7d2] shadow-hms-card overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e4e9ed]">
          <h3 className="text-[14px] font-bold">Cấu hình bảo hiểm y tế</h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="p-3 bg-[#e3f2fd] text-[#1565c0] border border-[#bfdbfe] rounded-lg text-[13px]">
            Mức hưởng và số tiền được tính, snapshot tại server khi lập hóa đơn.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-[12px] font-bold text-[#707882]">
              Mức hưởng BHYT
              <select
                value={benefitLevel}
                onChange={(event) => setBenefitLevel(event.target.value as BenefitLevel)}
                className="mt-1 w-full h-10 px-3 border border-[#bfc7d2] rounded-md bg-white text-[13px] text-[#171c1f]"
              >
                {benefitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[12px] font-bold text-[#707882]">
              Tuyến khám BHYT
              <select
                value={benefitLevel === 'NO_COVERAGE' ? '' : routeType}
                onChange={(event) => setRouteType(event.target.value as RouteType)}
                disabled={benefitLevel === 'NO_COVERAGE'}
                className="mt-1 w-full h-10 px-3 border border-[#bfc7d2] rounded-md bg-white text-[13px] text-[#171c1f] disabled:bg-[#f0f4f8]"
              >
                <option value="" disabled>
                  Chọn tuyến khám
                </option>
                {routeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-[#bfc7d2] shadow-hms-card overflow-hidden p-5">
        <div className="flex items-center justify-between border-b border-[#e4e9ed] pb-3">
          <h3 className="text-[14px] font-bold">Danh mục dịch vụ y tế</h3>
          <span className="px-2.5 py-0.5 rounded-full bg-[#cee5ff] text-[#006096] font-bold text-[11px]">
            {serviceItems.length} dịch vụ
          </span>
        </div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-[13px] text-[#171c1f]">
            <thead className="bg-[#f0f4f8] text-[11.5px] font-bold text-[#707882] uppercase">
              <tr>
                <th className="px-4 py-2.5">Tên dịch vụ</th>
                <th className="px-4 py-2.5 text-center">SL</th>
                <th className="px-4 py-2.5 text-right">Đơn giá</th>
                <th className="px-4 py-2.5 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f8]">
              {serviceItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-center font-mono">{item.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {item.unitPrice.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold">Theo hệ thống</td>
                </tr>
              ))}
            </tbody>
          </table>
          {serviceItems.length === 0 ? (
            <p className="px-4 py-3 text-[12px] text-[#707882]">
              Chưa có dữ liệu dịch vụ từ hồ sơ. Server sẽ kiểm tra lại trước khi lập hóa đơn.
            </p>
          ) : null}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#bfc7d2] p-5 shadow-hms-card">
          <h3 className="text-[13px] font-bold">Nguyên tắc tính tiền</h3>
          <p className="text-xs text-[#3f4851] leading-relaxed mt-2">
            Hệ thống lấy dịch vụ và đơn giá từ dữ liệu nghiệp vụ, tự tính BHYT và số tiền người bệnh
            phải trả sau khi xác thực hồ sơ.
          </p>
        </div>
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-[#006096] to-[#004068] text-white rounded-xl p-5 shadow-lg space-y-2.5">
            <div className="flex justify-between text-[13px]">
              <span>Tổng chi phí gốc</span>
              <span className="font-mono">Theo hệ thống</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span>Quỹ BHYT chi trả</span>
              <span className="font-mono">Theo hệ thống</span>
            </div>
            <div className="border-t border-white/20 pt-3 flex justify-between text-base font-bold">
              <span>Bệnh nhân phải trả</span>
              <span className="font-mono text-2xl">—</span>
            </div>
          </div>
          {errorMessage ? (
            <div
              role="alert"
              className="rounded-md bg-[#ffdad6] px-3 py-2 text-[12px] text-[#ba1a1a]"
            >
              {errorMessage}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void handleConfirmInvoice()}
            disabled={isBusy}
            className="w-full py-3 bg-[#006096] text-white rounded-lg font-bold text-sm disabled:opacity-50 min-h-[44px]"
          >
            {isBusy ? 'Đang lập hóa đơn…' : 'Xuất hóa đơn & Bảng kê'}
          </button>
        </div>
      </div>
    </div>
  );
}
