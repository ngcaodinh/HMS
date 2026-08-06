/** Kiểm tra bản in bảng kê dùng dữ liệu giao dịch, đúng đơn vị VNĐ và mở cửa sổ in riêng. */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPaymentStatementPrintHtml,
  printPaymentStatementDocument,
} from '../src/modules/invoice/components/print-payment-statement';
import type { Invoice, PatientRecord } from '../src/modules/invoice/types/invoice.types';

const patient: PatientRecord = {
  id: 'patient-1',
  recordId: 'record-1',
  code: 'BN-001',
  fullName: 'Nguyễn Văn <A>',
  dob: '01/01/1990',
  gender: 'Nam',
  bhytCardNumber: 'HS-001',
  bhytBenefitRate: 0.8,
  bhytCategory: 'Đúng tuyến',
  department: 'Khoa Nội',
  admissionDate: '2026-08-05T08:00:00.000Z',
  status: 'pending_payment',
  depositAmount: 100000,
  totalServicesAmount: 500000,
  bhytTotalPays: 400000,
  patientCoPayAmount: 100000,
  remainingAmount: 50000,
};

const invoice: Invoice = {
  id: 'invoice-1',
  invoiceNumber: 'INV-001',
  patientId: 'patient-1',
  patientName: patient.fullName,
  createdAt: '2026-08-05T09:00:00.000Z',
  status: 'pending_payment',
  items: [
    {
      id: 'item-1',
      code: 'DV-1',
      name: 'Khám <da>',
      category: 'khambenh',
      quantity: 1,
      unitPrice: 500000,
      totalPrice: 500000,
      bhytCoverRate: 0.8,
      bhytPays: 400000,
      patientPays: 100000,
    },
  ],
  subtotal: 500000,
  bhytDiscount: 400000,
  advanceDeduction: 50000,
  finalAmount: 50000,
};

test('accounting print creates an isolated A4 statement with correct payment totals', () => {
  const html = createPaymentStatementPrintHtml(patient, invoice);

  assert.match(html, /@page \{ size: A4 portrait/);
  assert.match(html, /Bệnh viện Da liễu Trung ương/);
  assert.doesNotMatch(html, /Bệnh viện Da liễu TP\.HCM/);
  assert.match(html, /Mẫu số: 01\/KBCB/);
  assert.match(html, /Nguyễn Văn &lt;A&gt;/);
  assert.match(html, /Khám &lt;da&gt;/);
  assert.match(html, /Tạm ứng đã trừ:<\/span><strong>50\.000 đ/);
  assert.match(html, /Số tiền người bệnh phải thanh toán:<\/strong><strong>50\.000 đ/);
  assert.doesNotMatch(html, /Thanh toán tiền mặt|Thanh toán MoMo|In bảng kê/);
  assert.doesNotMatch(html, /<script/i);
});

test('accounting print opens a separate document and invokes browser print', () => {
  const calls: string[] = [];
  const originalWindow = globalThis.window;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      open: () => ({
        document: {
          close: () => calls.push('close'),
          open: () => calls.push('open'),
          write: (value: string) => calls.push(value),
        },
        focus: () => calls.push('focus'),
        print: () => calls.push('print'),
      }),
    },
  });

  try {
    printPaymentStatementDocument('<html><body>statement</body></html>');
  } finally {
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      });
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
  }

  assert.deepEqual(calls, [
    'open',
    '<html><body>statement</body></html>',
    'close',
    'focus',
    'print',
  ]);
});
