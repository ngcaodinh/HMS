import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { join } from 'node:path';

import {
  formatVndInput,
  parsePositiveVnd,
  sanitizeVndInput,
} from '../src/modules/invoice/utils/payment-advance.validation';

test('accounting input validation keeps only digits while entering a VND amount', () => {
  assert.equal(sanitizeVndInput('2.000.000 đabc'), '2000000');
});

test('accounting input validation returns an empty value for blank or non-numeric input', () => {
  assert.equal(sanitizeVndInput(''), '');
  assert.equal(sanitizeVndInput('đ .,-'), '');
  assert.equal(sanitizeVndInput('  12 345  '), '12345');
});

test('accounting input validation formats a valid VND amount', () => {
  assert.equal(formatVndInput('2000000'), '2.000.000');
  assert.equal(formatVndInput('0002000000'), '2.000.000');
  assert.equal(formatVndInput('2.000.000 đ'), '2.000.000');
  assert.equal(formatVndInput(''), '');
});

test('accounting input validation rejects non-positive or unsafe amounts', () => {
  assert.equal(parsePositiveVnd(''), null);
  assert.equal(parsePositiveVnd('0'), null);
  assert.equal(parsePositiveVnd('2.5'), null);
  assert.equal(parsePositiveVnd(' 2000000'), null);
  assert.equal(parsePositiveVnd('-1'), null);
  assert.equal(parsePositiveVnd('9007199254740992'), null);
  assert.equal(parsePositiveVnd('0001'), 1);
  assert.equal(parsePositiveVnd('2000000'), 2_000_000);
});

test('accounting lookup contract caps search input and wires the real refresh callback', () => {
  const file = readFileSync(
    join(process.cwd(), 'src/modules/invoice/components/patient-lookup-screen.tsx'),
    'utf8',
  );

  assert.match(file, /maxLength=\{100\}/);
  assert.match(file, /onClick=\{onRefresh\}/);
});

test('accounting workspace contract uses backend APIs for candidates, write-off and advances', () => {
  const file = readFileSync(
    join(
      process.cwd(),
      'src/modules/invoice/pages/accounting-workspace/accounting-workspace-view.tsx',
    ),
    'utf8',
  );

  for (const apiName of [
    'listInvoiceCandidates',
    'writeOffInvoice',
    'createPaymentAdvance',
    'createPaymentAdvanceRefund',
  ]) {
    assert.match(file, new RegExp(`\\b${apiName}\\b`));
  }
  assert.equal(file.includes('advanceReceipts'), false);
});

test('accounting workspace renders only API data and uses the centered HMS notification', () => {
  const file = readFileSync(
    join(
      process.cwd(),
      'src/modules/invoice/pages/accounting-workspace/accounting-workspace-view.tsx',
    ),
    'utf8',
  );

  assert.match(file, /useState<PatientRecord\[\]>\(\[\]\)/);
  assert.match(file, /useState<PatientRecord \| null>\(null\)/);
  assert.match(file, /<AppToast centered/);
  assert.equal(file.includes('MOCK_'), false);
  assert.equal(file.includes('PATIENTS_DB'), false);
  assert.equal(file.includes('fixed bottom-6 right-6'), false);
});

test('accounting lookup exposes loading, API error and empty states', () => {
  const file = readFileSync(
    join(process.cwd(), 'src/modules/invoice/components/patient-lookup-screen.tsx'),
    'utf8',
  );

  assert.match(file, /isLoading\?: boolean/);
  assert.match(file, /errorMessage\?: string \| null/);
  assert.match(file, /Đang tải dữ liệu hồ sơ từ hệ thống/);
  assert.match(file, /Không có hồ sơ phù hợp với bộ lọc hiện tại/);
});

test('accounting shift report does not expose hard-coded financial totals', () => {
  const file = readFileSync(
    join(process.cwd(), 'src/modules/invoice/components/shift-report-screen.tsx'),
    'utf8',
  );

  assert.match(file, /summary: ShiftSummary \| null/);
  assert.match(file, /Chưa có dữ liệu ca trực từ hệ thống/);
  for (const hardCodedAmount of ['8.650.000', '3.220.000', '5.000.000', '890.000']) {
    assert.equal(file.includes(hardCodedAmount), false);
  }
});

test('accounting screens do not calculate invoice totals in the browser', () => {
  const file = readFileSync(
    join(process.cwd(), 'src/modules/invoice/components/invoice-creation-screen.tsx'),
    'utf8',
  );

  assert.match(file, /createInvoice/);
  assert.equal(file.includes('calculateTotals'), false);
  assert.match(file, /Theo hệ thống/);
});

test('advance screen validates formatted VND input and limits free-text reason length', () => {
  const file = readFileSync(
    join(process.cwd(), 'src/modules/invoice/components/advance-management-screen.tsx'),
    'utf8',
  );

  assert.match(file, /parsePositiveVnd/);
  assert.match(file, /maxLength=\{500\}/);
  assert.equal(file.includes('5.000.000'), false);
  assert.equal(file.includes('800.000'), false);
});

test('accounting payment statement renders invoice data instead of fixed mock fees', () => {
  const file = readFileSync(
    join(process.cwd(), 'src/modules/invoice/components/payment-statement-screen.tsx'),
    'utf8',
  );

  assert.match(file, /invoice\.items\.map/);
  assert.match(file, /invoice\.subtotal/);
  assert.match(file, /invoice\.bhytDiscount/);
  assert.match(file, /invoice\.finalAmount/);
  for (const hardCodedValue of ['1.290.000', '860.000', '430.000', '20/07/2026']) {
    assert.equal(file.includes(hardCodedValue), false);
  }
});
