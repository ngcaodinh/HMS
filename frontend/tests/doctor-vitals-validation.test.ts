import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  parseVitalNumber,
  validateBloodPressure,
  validateVitalField,
} from '../src/modules/doctor/components/vitals-validation';

describe('doctor vital-sign validation', () => {
  it('accepts Vietnamese decimal notation without showing the generic invalid-number error', () => {
    assert.equal(parseVitalNumber('120,0'), 120);
    assert.equal(validateVitalField('bloodPressureSystolic', '120,0'), '');
  });

  it('accepts a valid systolic/diastolic pair', () => {
    assert.deepEqual(
      validateBloodPressure({
        bloodPressureSystolic: '120',
        bloodPressureDiastolic: '80',
      }),
      {},
    );
  });

  it('revalidates the pair after the systolic value is corrected', () => {
    assert.notDeepEqual(
      validateBloodPressure({
        bloodPressureSystolic: '80',
        bloodPressureDiastolic: '120',
      }),
      {},
    );
    assert.deepEqual(
      validateBloodPressure({
        bloodPressureSystolic: '140',
        bloodPressureDiastolic: '80',
      }),
      {},
    );
  });
});
