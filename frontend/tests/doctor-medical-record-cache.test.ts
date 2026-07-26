import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  doctorWorklistQueryKey,
  medicalRecordDetailQueryKey,
  shouldInvalidateMedicalRecordQuery,
} from '../src/modules/doctor/services/medical-record-cache';

describe('doctor medical-record query keys', () => {
  it('scopes worklist cache by doctor id', () => {
    assert.deepEqual(doctorWorklistQueryKey('doctor-a'), ['medical-records', 'worklist', 'doctor-a']);
    assert.notDeepEqual(doctorWorklistQueryKey('doctor-a'), doctorWorklistQueryKey('doctor-b'));
  });

  it('scopes record detail cache by viewer id and record id', () => {
    assert.deepEqual(medicalRecordDetailQueryKey('doctor-a', 'record-1'), [
      'medical-records',
      'detail',
      'doctor-a',
      'record-1',
    ]);
    assert.notDeepEqual(
      medicalRecordDetailQueryKey('doctor-a', 'record-1'),
      medicalRecordDetailQueryKey('doctor-b', 'record-1'),
    );
    assert.notDeepEqual(
      medicalRecordDetailQueryKey('doctor-a', 'record-1'),
      medicalRecordDetailQueryKey('doctor-a', 'record-2'),
    );
  });
});

describe('shouldInvalidateMedicalRecordQuery', () => {
  it('refreshes every doctor worklist after a record mutation', () => {
    assert.equal(shouldInvalidateMedicalRecordQuery('record-1', doctorWorklistQueryKey('doctor-a')), true);
    assert.equal(shouldInvalidateMedicalRecordQuery('record-1', doctorWorklistQueryKey('doctor-b')), true);
  });

  it('refreshes only the mutated record detail query', () => {
    assert.equal(
      shouldInvalidateMedicalRecordQuery('record-1', medicalRecordDetailQueryKey('doctor-a', 'record-1')),
      true,
    );
    assert.equal(
      shouldInvalidateMedicalRecordQuery('record-1', medicalRecordDetailQueryKey('doctor-a', 'record-2')),
      false,
    );
    assert.equal(shouldInvalidateMedicalRecordQuery('record-1', ['auth', 'me']), false);
  });
});
