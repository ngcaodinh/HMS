import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  classifyPatientSearchQuery,
  emptyNewPatientForm,
  getReceptionFieldErrors,
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

describe('reception inline form validation', () => {
  it('returns an error for every invalid new-patient field', () => {
    const errors = getReceptionFieldErrors({
      form: {
        ...emptyNewPatientForm,
        dateOfBirth: '2027-02-30',
        fullName: 'A'.repeat(256),
        identityCardNumber: '123',
        phoneNumber: '0123456789',
        privacyNoticeAccepted: false,
      },
      doctorId: '',
      hasActiveTicket: true,
      legalDate: '2026-08-04',
      noPhone: false,
    });

    assert.equal(errors.fullName, 'Họ và tên tối đa 255 ký tự');
    assert.equal(errors.dateOfBirth, 'Ngày sinh không hợp lệ');
    assert.equal(errors.phoneNumber, 'Số điện thoại phải 10 số đầu di động Việt Nam');
    assert.equal(errors.identityCardNumber, 'CCCD phải đủ 12 chữ số');
    assert.equal(errors.privacyNoticeAccepted, 'Cần xác nhận thông báo bảo vệ dữ liệu cá nhân');
    assert.equal(errors.doctorId, 'Vui lòng chọn bác sĩ khám');
  });

  it('allows a missing phone only when no-phone reason is provided', () => {
    const errors = getReceptionFieldErrors({
      form: {
        ...emptyNewPatientForm,
        dateOfBirth: '1990-01-01',
        fullName: 'Nguyễn Văn A',
        phoneNumberUnavailableReason: 'Bệnh nhân neo đơn',
        privacyNoticeAccepted: true,
      },
      doctorId: 'doctor-1',
      hasActiveTicket: true,
      legalDate: '2026-08-04',
      noPhone: true,
    });

    assert.equal(errors.phoneNumber, undefined);
    assert.equal(errors.phoneNumberUnavailableReason, undefined);
  });

  it('rejects a health-insurance code longer than the backend limit', () => {
    const errors = getReceptionFieldErrors({
      form: {
        ...emptyNewPatientForm,
        dateOfBirth: '1990-01-01',
        fullName: 'Nguyễn Văn A',
        healthInsuranceCode: 'A'.repeat(21),
        phoneNumber: '0912345678',
        privacyNoticeAccepted: true,
      },
      doctorId: 'doctor-1',
      hasActiveTicket: true,
      legalDate: '2026-08-04',
      noPhone: false,
    });

    assert.equal(errors.healthInsuranceCode, 'Mã số thẻ BHYT tối đa 20 ký tự');
  });

  it('skips new-patient fields for an existing patient while keeping workflow errors', () => {
    const errors = getReceptionFieldErrors({
      form: { ...emptyNewPatientForm },
      doctorId: '',
      existingPatientId: 'patient-1',
      hasActiveTicket: true,
      legalDate: '2026-08-04',
      noPhone: false,
    });

    assert.deepEqual(errors, {
      doctorId: 'Vui lòng chọn bác sĩ khám',
    });
  });
});
