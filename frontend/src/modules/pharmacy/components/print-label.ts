import type { DispensablePrescription } from '../types/prescription-dispense.types';

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
}

/** Client-side only — no server print/label endpoint exists, matches the dispensing scope's "basic" cut. */
export function printDispenseLabel(prescription: DispensablePrescription): void {
  const printWindow = window.open('', '_blank', 'width=420,height=600');
  if (!printWindow) return;

  const itemsHtml = prescription.items
    .map(
      (item) => `
        <div class="item">
          <p class="name">${escapeHtml(item.medicineNameSnapshot ?? '—')}</p>
          <p class="dose">SL: ${item.quantity} · ${item.days} ngày${item.dosePerUse ? ` · ${escapeHtml(item.dosePerUse)}` : ''}</p>
          <p class="instruction">${escapeHtml(item.dosageInstruction)}</p>
        </div>`,
    )
    .join('');

  printWindow.document.write(`
    <!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Nhãn hướng dẫn sử dụng #${escapeHtml(prescription.prescriptionCode ?? prescription.prescriptionId)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; color: #171c1f; }
          h1 { font-size: 15px; margin: 0 0 4px; }
          .meta { font-size: 12px; color: #3f4851; margin-bottom: 12px; }
          .item { border-top: 1px dashed #c0c7d1; padding: 8px 0; }
          .name { font-weight: bold; font-size: 13px; margin: 0; }
          .dose { font-size: 12px; margin: 2px 0; color: #3f4851; }
          .instruction { font-size: 12px; margin: 0; }
          .footer { margin-top: 16px; font-size: 10px; color: #707882; }
        </style>
      </head>
      <body>
        <h1>Nhãn hướng dẫn sử dụng thuốc</h1>
        <p class="meta">
          Đơn #${escapeHtml(prescription.prescriptionCode ?? prescription.prescriptionId)}<br />
          BN: ${escapeHtml(prescription.patient.fullName)} (${escapeHtml(prescription.patient.patientCode)})
        </p>
        ${itemsHtml}
        <p class="footer">In từ HMS-VN · Phân hệ Quản lý Dược &amp; Nhà thuốc</p>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
