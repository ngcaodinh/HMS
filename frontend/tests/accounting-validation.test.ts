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
