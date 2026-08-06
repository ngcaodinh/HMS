import type { Invoice, PatientRecord } from '../types/invoice.types';

/** Giá trị động của tài liệu in; null/undefined được thay bằng chuỗi rỗng trước khi escape. */
type PrintValue = string | number | null | undefined;

/** Nhãn tiếng Việt cho nhóm dịch vụ; số lượng và tiền vẫn lấy từ snapshot hóa đơn. */
const serviceCategoryLabels: Record<Invoice['items'][number]['category'], string> = {
  khambenh: 'Khám bệnh',
  xetnghiem: 'Xét nghiệm',
  sieuan: 'Siêu âm',
  thuoc: 'Thuốc',
  phauthuat: 'Phẫu thuật',
  khac: 'Dịch vụ khác',
};

/**
 * Escape dữ liệu động trước khi chèn vào HTML của bảng kê.
 *
 * @param value - Giá trị hiển thị từ dữ liệu hồ sơ/hóa đơn.
 * @returns Chuỗi an toàn cho ngữ cảnh text; null và undefined trở thành chuỗi rỗng.
 * @remarks Đây chỉ là bảo vệ khi dựng HTML, không thay thế kiểm tra quyền truy cập hồ sơ ở caller.
 */
export function escapePaymentStatementPrintHtml(value: PrintValue): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Định dạng số tiền VNĐ theo locale Việt Nam cho bản in; không tự làm tròn hay quyết định số tiền. */
function formatVnd(value: number): string {
  return `${value.toLocaleString('vi-VN')} đ`;
}

/** Định dạng chuỗi ngày/giờ theo locale Việt Nam, giữ nguyên chuỗi gốc nếu không parse được. */
function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}

/**
 * Định dạng tỷ lệ BHYT dạng tỉ số 0..1 thành phần trăm hiển thị.
 * Tỷ lệ phải là snapshot do server cung cấp; hàm không nhận input điều chỉnh từ người dùng.
 */
function formatPercent(value: number): string {
  return `${(value * 100).toLocaleString('vi-VN')}%`;
}

/** Ánh xạ phương thức hóa đơn sang nhãn in; phương thức thiếu được fallback thành chưa thanh toán. */
function getPaymentLabel(paymentMethod?: Invoice['paymentMethod']): string {
  if (paymentMethod === 'cash') return 'Tiền mặt';
  if (paymentMethod === 'momo') return 'MoMo';
  if (paymentMethod === 'vietqr') return 'VietQR';
  return 'Chưa thanh toán';
}

/** Chuẩn hóa một giá trị động qua lớp escape dùng chung của tài liệu in. */
function printValue(value: PrintValue): string {
  return escapePaymentStatementPrintHtml(value);
}

/**
 * Tạo các dòng chi phí HTML từ snapshot hóa đơn; danh sách rỗng hiển thị một dòng trạng thái trống.
 * Mọi giá trị động đều được escape và không được tính lại ở client.
 */
function renderItemRows(invoice: Invoice): string {
  if (invoice.items.length === 0) {
    return '<tr><td class="empty" colspan="7">Chưa có dòng chi phí từ hệ thống.</td></tr>';
  }

  return invoice.items
    .map(
      (item, index) => `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${printValue(`${serviceCategoryLabels[item.category]} — ${item.name}`)}</td>
          <td class="center">${printValue(item.quantity)}</td>
          <td class="money">${printValue(formatVnd(item.unitPrice))}</td>
          <td class="money">${printValue(formatVnd(item.totalPrice))}</td>
          <td class="money">${printValue(formatVnd(item.bhytPays))}</td>
          <td class="money">${printValue(formatVnd(item.patientPays))}</td>
        </tr>`,
    )
    .join('');
}

/**
 * Cộng phần người bệnh trả theo từng dòng để hiển thị trong bảng kê.
 * Đây là tổng phụ của snapshot dòng dịch vụ, không thay thế `finalAmount` và không bao gồm khấu
 * trừ tạm ứng hoặc client tự quyết định giảm BHYT.
 */
function getPatientCopay(invoice: Invoice): number {
  return invoice.items.reduce((total, item) => total + item.patientPays, 0);
}

/**
 * Tạo tài liệu bảng kê A4 độc lập từ snapshot hồ sơ và hóa đơn.
 *
 * @param patient - Snapshot hồ sơ do caller tải và kiểm soát quyền truy cập.
 * @param invoice - Snapshot dòng chi phí, trạng thái, BHYT, tạm ứng và phương thức thanh toán.
 * @returns Chuỗi HTML hoàn chỉnh, đã escape dữ liệu động và có fallback dòng chi phí rỗng.
 * @remarks Hàm chỉ tạo snapshot HTML tại thời điểm gọi: không fetch, không mutation, không tự tính
 * lại tiền/tỷ lệ BHYT và không xác nhận thanh toán. Caller phải bảo đảm access boundary trước khi
 * đưa dữ liệu hồ sơ vào bản in.
 */
export function createPaymentStatementPrintHtml(
  patient: PatientRecord,
  invoice: Invoice,
): string {
  const patientCopay = getPatientCopay(invoice);
  const statusLabel =
    invoice.status === 'paid'
      ? 'Đã thanh toán'
      : invoice.status === 'cancelled'
        ? 'Đã hủy'
        : invoice.status === 'write_off'
          ? 'Miễn giảm thất thu'
          : 'Chờ thanh toán';

  const statusStamp =
    invoice.status === 'paid'
      ? '<div class="stamp">ĐÃ THANH TOÁN</div>'
      : invoice.status === 'cancelled'
        ? '<div class="stamp stamp-muted">ĐÃ HỦY</div>'
        : '';

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${printValue(`Bảng kê ${invoice.invoiceNumber}`)}</title>
    <style>
      @page { size: A4 portrait; margin: 12mm 14mm 14mm; }
      * { box-sizing: border-box; }
      body {
        color: #111827;
        font-family: Arial, "Helvetica Neue", sans-serif;
        font-size: 10pt;
        line-height: 1.35;
        margin: 0;
      }
      .document { position: relative; width: 100%; }
      .hospital-header { display: flex; justify-content: space-between; gap: 16mm; }
      .hospital-name { font-size: 11pt; font-weight: 700; text-transform: uppercase; }
      .hospital-meta { font-size: 9pt; margin-top: 2px; }
      .document-meta { font-size: 9pt; text-align: right; white-space: nowrap; }
      h1 { font-size: 16pt; margin: 10mm 0 1mm; text-align: center; text-transform: uppercase; }
      .subtitle { font-size: 10pt; margin: 0 0 6mm; text-align: center; }
      .patient-info { border: 1px solid #374151; border-collapse: collapse; width: 100%; }
      .patient-info td { padding: 2.5mm 3mm; vertical-align: top; width: 25%; }
      .patient-info .label { font-weight: 700; }
      .items { border: 1px solid #374151; border-collapse: collapse; margin-top: 5mm; table-layout: fixed; width: 100%; }
      .items th, .items td { border: 1px solid #374151; padding: 2mm 1.5mm; }
      .items th { background: #e5e7eb; font-size: 9pt; text-align: center; }
      .items th:nth-child(1) { width: 7%; }
      .items th:nth-child(2) { width: 32%; }
      .items th:nth-child(3) { width: 8%; }
      .items th:nth-child(4) { width: 14%; }
      .items th:nth-child(5) { width: 14%; }
      .items th:nth-child(6) { width: 13%; }
      .items th:nth-child(7) { width: 12%; }
      .items td { overflow-wrap: anywhere; }
      .items .center { text-align: center; }
      .items .money { font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
      .items .empty { padding: 6mm; text-align: center; }
      .items .total-row { font-weight: 700; }
      .summary { margin: 5mm 0 0 auto; width: 70%; }
      .summary-row { display: flex; justify-content: space-between; gap: 10mm; padding: 1.5mm 0; }
      .summary-row strong:last-child { font-variant-numeric: tabular-nums; white-space: nowrap; }
      .summary-row.final { border-top: 1px solid #374151; font-size: 12pt; margin-top: 1mm; padding-top: 3mm; }
      .note { font-size: 9pt; margin-top: 5mm; }
      .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20mm; margin-top: 13mm; text-align: center; }
      .signature-title { font-weight: 700; }
      .signature-space { height: 22mm; }
      .stamp { border: 2px solid #991b1b; color: #991b1b; display: inline-block; font-size: 14pt; font-weight: 700; left: 50%; letter-spacing: 2px; opacity: .22; padding: 2mm 5mm; position: absolute; top: 48mm; transform: translateX(-50%) rotate(-12deg); }
      .stamp-muted { border-color: #4b5563; color: #4b5563; }
      @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
    </style>
  </head>
  <body>
    <article class="document">
      ${statusStamp}
      <header class="hospital-header">
        <div>
          <div class="hospital-name">Bệnh viện Da liễu Trung ương</div>
          <div class="hospital-meta">Khoa/Phòng: Thu ngân &amp; Kế toán</div>
        </div>
        <div class="document-meta">
          <div>Mẫu số: 01/KBCB</div>
          <div>Số: ${printValue(invoice.invoiceNumber)}</div>
        </div>
      </header>

      <h1>Bảng kê chi phí khám bệnh, chữa bệnh</h1>
      <p class="subtitle">(Kèm theo hóa đơn ${printValue(invoice.invoiceNumber)})</p>

      <table class="patient-info">
        <tbody>
          <tr>
            <td><span class="label">Họ và tên:</span> ${printValue(patient.fullName)}</td>
            <td><span class="label">Mã người bệnh:</span> ${printValue(patient.code)}</td>
            <td><span class="label">Ngày sinh:</span> ${printValue(patient.dob)}</td>
            <td><span class="label">Ngày khám:</span> ${printValue(formatDate(patient.admissionDate))}</td>
          </tr>
          <tr>
            <td colspan="2"><span class="label">Số thẻ BHYT:</span> ${printValue(patient.bhytCardNumber)}</td>
            <td><span class="label">Mức hưởng:</span> ${printValue(formatPercent(patient.bhytBenefitRate))}</td>
            <td><span class="label">Phương thức:</span> ${printValue(getPaymentLabel(invoice.paymentMethod))}</td>
          </tr>
          <tr>
            <td colspan="3"><span class="label">Đối tượng/Quyền lợi BHYT:</span> ${printValue(patient.bhytCategory)}</td>
            <td><span class="label">Trạng thái:</span> ${printValue(statusLabel)}</td>
          </tr>
        </tbody>
      </table>

      <table class="items">
        <thead>
          <tr>
            <th>STT</th>
            <th>Nội dung dịch vụ</th>
            <th>SL</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
            <th>BHYT trả</th>
            <th>Người bệnh trả</th>
          </tr>
        </thead>
        <tbody>
          ${renderItemRows(invoice)}
          <tr class="total-row">
            <td colspan="4">Cộng</td>
            <td class="money">${printValue(formatVnd(invoice.subtotal))}</td>
            <td class="money">${printValue(formatVnd(invoice.bhytDiscount))}</td>
            <td class="money">${printValue(formatVnd(patientCopay))}</td>
          </tr>
        </tbody>
      </table>

      <section class="summary" aria-label="Tổng hợp thanh toán">
        <div class="summary-row"><span>Cộng chi phí:</span><strong>${printValue(formatVnd(invoice.subtotal))}</strong></div>
        <div class="summary-row"><span>Quỹ BHYT thanh toán:</span><strong>${printValue(formatVnd(invoice.bhytDiscount))}</strong></div>
        <div class="summary-row"><span>Tạm ứng đã trừ:</span><strong>${printValue(formatVnd(invoice.advanceDeduction))}</strong></div>
        <div class="summary-row final"><strong>Số tiền người bệnh phải thanh toán:</strong><strong>${printValue(formatVnd(invoice.finalAmount))}</strong></div>
      </section>

      <p class="note">Ngày lập bảng kê: ${printValue(formatDate(invoice.createdAt))}. Bảng kê được lập từ dữ liệu đã lưu trên hệ thống HMS.</p>

      <section class="signatures">
        <div>
          <div class="signature-title">Người bệnh/người đại diện</div>
          <div class="signature-space"></div>
          <div>(Ký, ghi rõ họ tên)</div>
        </div>
        <div>
          <div class="signature-title">Nhân viên thu ngân</div>
          <div class="signature-space"></div>
          <div>(Ký, ghi rõ họ tên)</div>
        </div>
      </section>
    </article>
  </body>
</html>`;
}

/**
 * Mở cửa sổ trình duyệt riêng và gửi tài liệu bảng kê A4 tới lệnh in.
 *
 * @param html - HTML snapshot đã được tạo bởi `createPaymentStatementPrintHtml` sau khi escape.
 * @remarks Đây là side effect của trình duyệt: mở cửa sổ, ghi document và gọi print. Nếu popup bị
 * chặn, hàm trả về yên lặng; hàm không fetch dữ liệu, không cấp quyền và không thay đổi invoice.
 */
export function printPaymentStatementDocument(html: string): void {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
