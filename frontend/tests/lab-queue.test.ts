import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { join } from 'node:path';

import { getQueueActionVisibility } from '../src/modules/lab/components/queue-list';
import type { LabTestStatus } from '../src/modules/lab/types/lab-test.types';

test('lab queue keeps only the supported filter tabs', () => {
  const file = readFileSync(
    join(process.cwd(), 'src/modules/lab/components/queue-list.tsx'),
    'utf8',
  );

  assert.doesNotMatch(file, /onChangeFilterTab\('in_progress'\)/);
  assert.doesNotMatch(file, /filterTab === 'in_progress'/);
  assert.doesNotMatch(file, /waitingCount/);
  assert.doesNotMatch(file, /icon-lab-order\.svg/);
});

test('lab queue hides view for resulted tests and print for in-progress tests', () => {
  const statuses: LabTestStatus[] = ['ordered', 'in_progress', 'resulted'];

  assert.deepEqual(
    statuses.map((status) => getQueueActionVisibility(status)),
    [
      { canEnterResult: true, canPrint: true },
      { canEnterResult: true, canPrint: false },
      { canEnterResult: false, canPrint: true },
    ],
  );
});

test('lab queue filter active states use visible non-white colors', () => {
  const styles = readFileSync(
    join(process.cwd(), 'src/modules/lab/pages/workspace/lab-workspace.styles.ts'),
    'utf8',
  );

  assert.match(styles, /filterTabActive: '[^']*text-\[#004871\]/);
  assert.match(styles, /filterTabDangerActive: '[^']*text-\[#991b1b\]/);
  assert.doesNotMatch(styles, /filterTab(?:Danger)?Active: '[^']*text-white/);
});

test('lab queue filter buttons share one fixed width and centered content', () => {
  const styles = readFileSync(
    join(process.cwd(), 'src/modules/lab/pages/workspace/lab-workspace.styles.ts'),
    'utf8',
  );

  assert.match(styles, /filterTab:\s*\n?\s*'[^']*w-36[^']*justify-center/);
});

test('lab queue row actions share one fixed button size', () => {
  const styles = readFileSync(
    join(process.cwd(), 'src/modules/lab/pages/workspace/lab-workspace.styles.ts'),
    'utf8',
  );
  const queue = readFileSync(
    join(process.cwd(), 'src/modules/lab/components/queue-list.tsx'),
    'utf8',
  );

  assert.match(styles, /queueActionButton:\s*\n?\s*'[^']*h-9 w-24[^']*justify-center/);
  assert.match(queue, /styles\.queueActionButton, styles\.queueActionPrimary/);
  assert.match(queue, /styles\.queueActionButton, styles\.queueActionSecondary/);
});
