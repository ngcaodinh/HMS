import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  classifyPatientSearchQuery,
  emptyNewPatientForm,
  isInsuranceExpired,
} from '../src/modules/reception/constants/reception.constants';

describe('reception new-patient defaults', () => {
  it('requires an explicit privacy consent action for every new patient form', () => {
    assert.equal(emptyNewPatientForm.privacyNoticeAccepted, false);
  });

  it('keeps the default form free of stale identity and insurance data', () => {
    assert.deepEqual(emptyNewPatientForm, {
      address: '',
      dateOfBirth: '',
      fullName: '',
      gender: 'male',
      healthInsuranceCode: '',
      healthInsuranceExpiryDate: '',
      identityCardNumber: '',
      phoneNumber: '',
      phoneNumberUnavailableReason: '',
      privacyNoticeAccepted: false,
    });
  });
});

describe('reception search and insurance validation helpers', () => {
  it('classifies every patient search branch before calling the API', () => {
    assert.equal(classifyPatientSearchQuery(''), 'empty');
    assert.equal(classifyPatientSearchQuery('   '), 'empty');
    assert.equal(classifyPatientSearchQuery('Nguyen Van A'), 'fullName');
    assert.equal(classifyPatientSearchQuery('0912345678'), 'phoneNumber');
    assert.equal(classifyPatientSearchQuery('123456789012'), 'identityCardNumber');
    assert.equal(classifyPatientSearchQuery('12345'), 'invalidNumeric');
    assert.equal(classifyPatientSearchQuery('1234567890123'), 'invalidNumeric');
  });

  it('shows the BHYT expiry warning only for a date before the legal date', () => {
    assert.equal(isInsuranceExpired('', '2026-08-04'), false);
    assert.equal(isInsuranceExpired('2026-08-03', '2026-08-04'), true);
    assert.equal(isInsuranceExpired('2026-08-04', '2026-08-04'), false);
    assert.equal(isInsuranceExpired('2026-08-05', '2026-08-04'), false);
  });
});
