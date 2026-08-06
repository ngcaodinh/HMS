'use client';

import { Invoice, PatientRecord } from '../types/invoice.types';
import {
  createPaymentStatementPrintHtml,
  printPaymentStatementDocument,
} from './print-payment-statement';

interface PaymentStatementScreenProps {
  patient: PatientRecord;
  invoice: Invoice;
  onOpenCashModal: () => void;
  onOpenMomoModal: () => void;
  onOpenCancelModal: () => void;
  onOpenWriteoffModal: () => void;
  onBack: () => void;
}

// Nhãn hiển thị giữ nguyên category chuẩn hóa từ backend, không dùng để tính lại tiền.
const serviceCategoryLabels: Record<Invoice['items'][number]['category'], string> = {
  khambenh: 'Khám bệnh',
  xetnghiem: 'Xét nghiệm',
  sieuan: 'Siêu âm',
  thuoc: 'Thuốc',
  phauthuat: 'Phẫu thuật',
  khac: 'Dịch vụ khác',
};

/** Định dạng số tiền nguyên theo locale Việt Nam và đơn vị VNĐ để trình bày, không làm tròn lại. */
function formatVnd(value: number): string {
  return `${value.toLocaleString('vi-VN')} đ`;
}

/** Định dạng ngày từ chuỗi API; giữ chuỗi gốc nếu giá trị không parse được. */
function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}

/** Ánh xạ phương thức thanh toán lưu trong invoice sang nhãn hiển thị, fallback là chưa thu. */
function getPaymentLabel(paymentMethod?: Invoice['paymentMethod']): string {
  if (paymentMethod === 'cash') return 'Tiền mặt';
  if (paymentMethod === 'momo') return 'MoMo';
  if (paymentMethod === 'vietqr') return 'VietQR';
  return 'Chưa thanh toán';
}

/** Cộng phần người bệnh tự trả từ từng dòng invoice; đơn vị là VNĐ nguyên. */
function getPatientCopay(invoice: Invoice): number {
  return invoice.items.reduce((total, item) => total + item.patientPays, 0);
}

/**
 * Hiển thị bảng kê và các thao tác thanh toán theo invoice đã tải từ backend.
 *
 * @param props - Hồ sơ, invoice và callback mở modal hoặc quay lại lookup.
 * @param props.patient - Hồ sơ đã được workspace đối chiếu với invoice.
 * @param props.invoice - Snapshot invoice gồm status, dòng chi phí, BHYT và số tiền VNĐ.
 * @param props.onOpenCashModal - Mở xác nhận thu tiền mặt khi invoice pending.
 * @param props.onOpenMomoModal - Mở/khởi tạo luồng thanh toán MoMo khi invoice pending.
 * @param props.onOpenCancelModal - Mở xác nhận hủy invoice pending.
 * @param props.onOpenWriteoffModal - Mở xác nhận write-off invoice pending.
 * @param props.onBack - Quay lại lookup, không tự thay đổi dữ liệu server.
 * @remarks UI phân biệt paid, cancelled, write_off, pending_payment và empty items. Component chỉ
 * phát callback; backend là nguồn quyết định trạng thái, số tiền và quyền mutation. In bảng kê tạo
 * snapshot HTML từ dữ liệu hiện tại rồi mở cửa sổ in.
 */
export function PaymentStatementScreen({
  patient,
  invoice,
  onOpenCashModal,
  onOpenMomoModal,
  onOpenCancelModal,
  onOpenWriteoffModal,
  onBack,
}: PaymentStatementScreenProps) {
  // Hiển thị đã thu nếu một trong hai snapshot đã xác nhận settled/paid; mutation vẫn do backend.
  const isPaid = patient.status === 'settled' || invoice.status === 'paid';
  const canModifyInvoice = invoice.status === 'pending_payment';
  const amountToCollect = canModifyInvoice ? invoice.finalAmount : 0;
  const patientCopay = getPatientCopay(invoice);
  const statusLabel =
    invoice.status === 'paid'
      ? 'Đã thanh toán'
      : invoice.status === 'cancelled'
        ? 'Đã hủy'
        : invoice.status === 'write_off'
          ? 'Miễn giảm thất thu'
          : 'Chờ thanh toán';

  return (
    <div className="screen active space-y-4 font-sans select-none animate-fadeIn" id="s3">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#171c1f] leading-tight">
            Thanh toán &amp; Bảng kê chi phí
          </h2>
          <p className="text-[13px] text-[#707882] mt-0.5">
            Mã hóa đơn:{' '}
            <span className="font-mono text-[#006096] font-bold">{invoice.invoiceNumber}</span> ·
            Bệnh nhân:{' '}
            <strong className="text-[#171c1f]">
              {patient.fullName} ({patient.code})
            </strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3.5 py-1.5 rounded-full font-bold text-[12.5px] inline-flex items-center gap-1.5 ${
              isPaid ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#fff8e1] text-[#a05c00]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {statusLabel}
          </span>
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-1.5 border border-[#bfc7d2] bg-[#f8fafc] text-[#707882] rounded-md text-[12.5px] font-medium min-h-[36px]"
          >
            ← Quay lại
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white rounded-xl border border-[#bfc7d2] p-8 shadow-hms-card relative space-y-5 min-h-[600px]">
          {isPaid ? (
            <div className="absolute top-[120px] right-[40px] border-[4px] border-[#ba1a1a] rounded-lg px-6 py-2 font-black text-[#ba1a1a] text-[32px] tracking-[4px] rotate-[-18deg] opacity-[0.25] pointer-events-none select-none">
              ĐÃ THANH TOÁN
            </div>
          ) : null}

          <div className="text-center">
            <h2 className="text-[14px] font-bold text-[#171c1f]">BỆNH VIỆN DA LIỄU HMS-VN</h2>
            <p className="text-[12px] text-[#707882]">Bảng kê chi phí khám chữa bệnh</p>
            <p className="text-[12px] text-[#707882]">Mã hóa đơn: {invoice.invoiceNumber}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px] py-3 border-y border-[#bfc7d2]">
            <div>
              <strong>Họ và tên:</strong> <span className="text-[#707882]">{patient.fullName}</span>
            </div>
            <div>
              <strong>Ngày sinh:</strong> <span className="text-[#707882]">{patient.dob}</span>
            </div>
            <div>
              <strong>Mã BN:</strong>{' '}
              <span className="font-mono text-[#707882]">{patient.code}</span>
            </div>
            <div>
              <strong>Số thẻ BHYT:</strong>{' '}
              <span className="font-mono text-[#707882]">{patient.bhytCardNumber}</span>
            </div>
            <div>
              <strong>Ngày khám:</strong>{' '}
              <span className="text-[#707882]">{formatDate(patient.admissionDate)}</span>
            </div>
            <div>
              <strong>Thông tin BHYT:</strong>{' '}
              <span className="text-[#707882]">{patient.bhytCategory}</span>
            </div>
            <div>
              <strong>Mức hưởng:</strong>{' '}
              <span className="text-[#707882]">
                {(patient.bhytBenefitRate * 100).toLocaleString('vi-VN')}%
              </span>
            </div>
            <div>
              <strong>Phương thức:</strong>{' '}
              <span className="text-[#707882]">{getPaymentLabel(invoice.paymentMethod)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11.5px] border border-[#bfc7d2]">
              <thead className="bg-[#cee5ff] text-[#006096] font-bold text-[11px]">
                <tr>
                  <th className="p-2 border border-[#bfc7d2]">Dịch vụ</th>
                  <th className="p-2 text-right border border-[#bfc7d2]">Tổng tiền</th>
                  <th className="p-2 text-right border border-[#bfc7d2]">BHYT chi trả</th>
                  <th className="p-2 text-right border border-[#bfc7d2]">BN tự trả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e9ed]">
                {invoice.items.length === 0 ? (
                  <tr>
                    <td className="p-4 text-center text-[#707882]" colSpan={4}>
                      Chưa có dòng chi phí từ hệ thống.
                    </td>
                  </tr>
                ) : (
                  invoice.items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="p-2 border border-[#e4e9ed]">
                        {index + 1}. {serviceCategoryLabels[item.category]} — {item.name}
                      </td>
                      <td className="p-2 text-right font-mono border border-[#e4e9ed]">
                        {formatVnd(item.totalPrice)}
                      </td>
                      <td className="p-2 text-right font-mono text-[#1a7a4a] border border-[#e4e9ed]">
                        {formatVnd(item.bhytPays)}
                      </td>
                      <td className="p-2 text-right font-mono border border-[#e4e9ed]">
                        {formatVnd(item.patientPays)}
                      </td>
                    </tr>
                  ))
                )}
                <tr className="bg-[#cee5ff] font-bold text-[#006096]">
                  <td className="p-2 border border-[#bfc7d2]">Cộng tổng chi phí</td>
                  <td className="p-2 text-right font-mono border border-[#bfc7d2]">
                    {formatVnd(invoice.subtotal)}
                  </td>
                  <td className="p-2 text-right font-mono border border-[#bfc7d2]">
                    {formatVnd(invoice.bhytDiscount)}
                  </td>
                  <td className="p-2 text-right font-mono border border-[#bfc7d2]">
                    {formatVnd(patientCopay)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#cee5ff] rounded-md flex items-center justify-between">
            <span className="text-[14px] font-bold text-[#006096]">
              Số tiền bệnh nhân phải thanh toán:
            </span>
            <span className="text-[20px] font-bold font-mono text-[#006096] tabular-nums">
              {formatVnd(invoice.finalAmount)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4 text-center text-[11.5px]">
            <div>
              <p className="text-[#707882] mb-6">Trạng thái chứng từ</p>
              <span className="inline-block border-2 border-[#006096] rounded px-3 py-1 text-xs font-bold text-[#006096]">
                Đã tải từ hệ thống
              </span>
            </div>
            <div>
              <p className="text-[#707882] mb-6">Biên lai</p>
              <span className="font-mono font-semibold text-[#171c1f]">
                {invoice.receiptNumber ?? 'Chưa phát sinh'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#bfc7d2] p-4 shadow-hms-card text-center">
            <div className="text-[12px] text-[#707882] mb-1">Số tiền cần thu</div>
            <div className="text-[32px] font-bold font-mono text-[#006096] leading-tight">
              {formatVnd(amountToCollect)}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#bfc7d2] p-4 shadow-hms-card space-y-3">
            <div className="text-[12px] font-bold text-[#707882] uppercase tracking-wider">
              Phương thức thanh toán
            </div>
            {isPaid ? (
              <div className="p-3 bg-[#d4f4e2] border border-[#a7f0c8] rounded-md text-center space-y-1">
                <div className="text-[12.5px] font-bold text-[#1a7a4a]">
                  Hóa đơn đã được thanh toán
                </div>
                <div className="text-[11px] text-[#1a7a4a]">
                  {invoice.receiptNumber ?? 'Đã ghi nhận trên hệ thống'}
                </div>
              </div>
            ) : invoice.status === 'pending_payment' ? (
              <>
                <button
                  type="button"
                  onClick={onOpenCashModal}
                  className="w-full py-3 bg-[#006096] text-white rounded-md font-bold text-[14px] min-h-[44px]"
                >
                  Thanh toán tiền mặt
                </button>
                <button
                  type="button"
                  onClick={onOpenMomoModal}
                  className="w-full py-3 bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white rounded-md font-bold text-[14px] min-h-[44px]"
                >
                  Thanh toán MoMo
                </button>
              </>
            ) : (
              <div className="p-3 bg-[#f0f4f8] border border-[#bfc7d2] rounded-md text-center text-[12.5px] text-[#707882]">
                Hóa đơn không còn ở trạng thái có thể thu tiền.
              </div>
            )}
          </div>

          {canModifyInvoice ? (
            <div className="bg-white rounded-xl border border-[#bfc7d2] p-4 shadow-hms-card space-y-2">
              <div className="text-[12px] font-bold text-[#707882] uppercase tracking-wider mb-2">
                Hành động đặc biệt
              </div>
              <button
                type="button"
                onClick={onOpenCancelModal}
                className="w-full py-2 border border-[#ba1a1a] text-[#ba1a1a] rounded-md font-medium text-[12.5px]"
              >
                Hủy hóa đơn
              </button>
              <button
                type="button"
                onClick={onOpenWriteoffModal}
                className="w-full py-2 border border-[#a05c00] text-[#a05c00] rounded-md font-medium text-[12.5px]"
              >
                Miễn giảm thất thu (Cấp cứu)
              </button>
            </div>
          ) : null}

          <div className="bg-white rounded-xl border border-[#bfc7d2] p-4 shadow-hms-card">
            <button
              type="button"
              onClick={() =>
                printPaymentStatementDocument(createPaymentStatementPrintHtml(patient, invoice))
              }
              className="w-full py-2 border border-[#006096] bg-[#cee5ff] text-[#006096] rounded-md font-bold text-[12.5px]"
            >
              In bảng kê 01/KBCB
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
