import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { join } from 'node:path';

test('accounting action buttons do not render checkmark icons', () => {
  const modalFiles = [
    'src/modules/invoice/components/modals/cash-payment-modal.tsx',
    'src/modules/invoice/components/modals/refund-modal.tsx',
  ];

  for (const filePath of modalFiles) {
    const file = readFileSync(join(process.cwd(), filePath), 'utf8');
    assert.equal(file.includes('M5 13l4 4L19 7'), false);
  }
});
