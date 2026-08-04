import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getAllergyNoteError,
  getBloodPressureRelationError,
  getMissingRequiredVitalFields,
  hasBlockingVitalFormErrors,
  getVisibleEmergencyIdentityErrors,
  getVisibleVitalFieldErrors,
  getVitalFieldError,
  validateEmergencyIdentity,
} from '../src/modules/nurse/pages/workspace/nurse-validation';

describe('nurse vitals validation helpers', () => {
  it('accepts every non-cross-field boundary that the backend accepts', () => {
    const boundaries = [
      ['pulse', '1', '300'],
      ['bpDiastolic', '1', '200'],
      ['respiratoryRate', '1', '100'],
      ['temperatureC', '25', '45'],
      ['spo2', '0', '100'],
      ['heightCm', '0.1', '300'],
      ['weightKg', '0.1', '500'],
    ] as const;

    for (const [field, min, max] of boundaries) {
      assert.equal(getVitalFieldError(field, min), undefined);
      assert.equal(getVitalFieldError(field, max), undefined);
    }
    assert.equal(getVitalFieldError('bpSystolic', '300'), undefined);
  });

  it('rejects values outside range, integer fields with decimals, and invalid numbers', () => {
    const invalidValues = [
      ['pulse', '0'],
      ['pulse', '301'],
      ['bpSystolic', '0'],
      ['bpSystolic', '301'],
      ['bpDiastolic', '0'],
      ['bpDiastolic', '201'],
      ['respiratoryRate', '0'],
      ['respiratoryRate', '101'],
      ['temperatureC', '24.9'],
      ['temperatureC', '45.1'],
      ['spo2', '-1'],
      ['spo2', '101'],
      ['heightCm', '0'],
      ['heightCm', '300.1'],
      ['weightKg', '0'],
      ['weightKg', '500.1'],
      ['pulse', '72.5'],
      ['bpSystolic', '120.5'],
      ['bpDiastolic', '80.5'],
      ['respiratoryRate', '16.5'],
      ['spo2', '98.5'],
      ['pulse', 'not-a-number'],
    ] as const;

    for (const [field, value] of invalidValues) {
      assert.notEqual(getVitalFieldError(field, value), undefined, `${field}=${value}`);
    }
    assert.equal(getVitalFieldError('pulse', ''), undefined);
  });

  it('rejects reversed blood pressure values and long allergy notes', () => {
    assert.equal(
      getBloodPressureRelationError('80', '120'),
      'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương, vui lòng kiểm tra lại (có thể đã nhập ngược)',
    );
    assert.equal(
      getAllergyNoteError(true, 'A'.repeat(1001), false),
      'Mô tả dị ứng tối đa 1000 ký tự',
    );
    assert.equal(
      getAllergyNoteError(true, '', true),
      'Vui lòng nhập mô tả chi tiết dị ứng trước khi lưu',
    );
    assert.equal(getAllergyNoteError(true, 'A'.repeat(1000), false), undefined);
    assert.equal(getAllergyNoteError(false, 'A'.repeat(1001), false), undefined);
  });

  it('does not treat optional vital fields as required after a failed submit', () => {
    assert.deepEqual(
      getMissingRequiredVitalFields({
        pulse: '80',
        bpSystolic: '120',
        bpDiastolic: '80',
        spo2: '98',
      }),
      [],
    );
    assert.deepEqual(getMissingRequiredVitalFields({ pulse: '80', bpSystolic: '120' }), [
      'bpDiastolic',
      'spo2',
    ]);
  });

  it('does not show untouched errors, but shows required errors after the field is blurred', () => {
    const emptyVitals = {
      pulse: '',
      temperatureC: '',
      bpSystolic: '',
      bpDiastolic: '',
      respiratoryRate: '',
      spo2: '',
      heightCm: '',
      weightKg: '',
    };

    assert.deepEqual(getVisibleVitalFieldErrors(emptyVitals, {}), {});
    assert.equal(
      getVisibleVitalFieldErrors(emptyVitals, { pulse: true }).pulse,
      'Vui lòng nhập giá trị này',
    );
    assert.equal(getVisibleVitalFieldErrors(emptyVitals, { heightCm: true }).heightCm, undefined);
  });

  it('shows the blood-pressure relation error for both fields after either field is blurred', () => {
    const vitals = {
      pulse: '80',
      temperatureC: '',
      bpSystolic: '80',
      bpDiastolic: '120',
      respiratoryRate: '',
      spo2: '98',
      heightCm: '',
      weightKg: '',
    };

    assert.deepEqual(getVisibleVitalFieldErrors(vitals, {}), {});
    const errors = getVisibleVitalFieldErrors(vitals, { bpDiastolic: true });
    assert.equal(errors.bpSystolic, getBloodPressureRelationError('80', '120'));
    assert.equal(errors.bpDiastolic, getBloodPressureRelationError('80', '120'));
  });

  it('does not mask an out-of-range blood-pressure error with the cross-field error', () => {
    const errors = getVisibleVitalFieldErrors(
      {
        bpSystolic: '0',
        bpDiastolic: '80',
      },
      { bpSystolic: true, bpDiastolic: true },
    );

    assert.equal(errors.bpSystolic, getVitalFieldError('bpSystolic', '0'));
    assert.equal(errors.bpDiastolic, undefined);
  });

  it('shows every remaining vital error after a submit attempt', () => {
    const errors = getVisibleVitalFieldErrors(
      {
        pulse: '0',
        temperatureC: '',
        bpSystolic: '120',
        bpDiastolic: '',
        respiratoryRate: '',
        spo2: '',
        heightCm: '',
        weightKg: '',
      },
      {},
      true,
    );

    assert.equal(errors.pulse, getVitalFieldError('pulse', '0'));
    assert.equal(errors.bpDiastolic, 'Vui lòng nhập giá trị này');
    assert.equal(errors.spo2, 'Vui lòng nhập giá trị này');
    assert.equal(errors.heightCm, undefined);
  });

  it('blocks saving until required vitals and enabled allergy details are complete', () => {
    const completeVitals = {
      pulse: '80',
      temperatureC: '',
      bpSystolic: '120',
      bpDiastolic: '80',
      respiratoryRate: '',
      spo2: '98',
      heightCm: '',
      weightKg: '',
    };

    assert.equal(hasBlockingVitalFormErrors({ ...completeVitals, spo2: '' }, false, ''), true);
    assert.equal(hasBlockingVitalFormErrors(completeVitals, false, ''), false);
    assert.equal(hasBlockingVitalFormErrors(completeVitals, true, ''), true);
    assert.equal(hasBlockingVitalFormErrors(completeVitals, true, 'Penicillin'), false);
    assert.equal(
      hasBlockingVitalFormErrors({ ...completeVitals, bpSystolic: '80' }, false, ''),
      true,
    );
  });
});

describe('nurse emergency identity validation', () => {
  const validForm = {
    fullName: 'NGUYỄN VĂN A',
    dateOfBirth: '1990-01-01',
    phoneNumber: '0901234567',
    identityCardNumber: '',
    guardianFullName: 'NGUYỄN THỊ B',
    guardianPhoneNumber: '0912345678',
    privacyConfirmed: true,
  };

  it('accepts the guardian alternative when CCCD is unavailable', () => {
    assert.deepEqual(validateEmergencyIdentity(validForm), {});
  });

  it('accepts a valid CCCD without guardian details', () => {
    assert.deepEqual(
      validateEmergencyIdentity({
        ...validForm,
        identityCardNumber: '001234567890',
        guardianFullName: '',
        guardianPhoneNumber: '',
      }),
      {},
    );
  });

  it('requires a valid identity-card or complete guardian pair', () => {
    const errors = validateEmergencyIdentity({
      ...validForm,
      guardianFullName: '',
      guardianPhoneNumber: '',
    });

    assert.equal(
      errors.identityCardNumber,
      'Cần nhập số CCCD hợp lệ, hoặc nhập đầy đủ họ tên và số điện thoại người giám hộ/đại diện',
    );
  });

  it('rejects old birth dates, invalid guardian phones and long guardian names', () => {
    const errors = validateEmergencyIdentity({
      ...validForm,
      dateOfBirth: '1899-12-31',
      guardianFullName: 'A'.repeat(256),
      guardianPhoneNumber: '0123456789',
    });

    assert.equal(errors.dateOfBirth, 'Ngày sinh không hợp lệ (phải từ năm 1900 trở về sau)');
    assert.equal(errors.guardianFullName, 'Họ tên người bảo hộ tối đa 255 ký tự');
    assert.equal(
      errors.guardianPhoneNumber,
      'Số điện thoại người giám hộ không đúng định dạng di động Việt Nam',
    );
  });

  it('covers required fields, valid boundaries and future birth dates', () => {
    assert.equal(
      validateEmergencyIdentity({ ...validForm, fullName: 'AB' }).fullName,
      'Họ và tên tối thiểu 3 ký tự',
    );
    assert.equal(
      validateEmergencyIdentity({ ...validForm, fullName: 'A'.repeat(256) }).fullName,
      'Họ và tên tối đa 255 ký tự',
    );
    assert.equal(
      validateEmergencyIdentity({ ...validForm, fullName: 'A'.repeat(255) }).fullName,
      undefined,
    );
    assert.equal(
      validateEmergencyIdentity({ ...validForm, dateOfBirth: '' }).dateOfBirth,
      'Vui lòng nhập ngày sinh',
    );
    assert.equal(
      validateEmergencyIdentity({ ...validForm, dateOfBirth: 'not-a-date' }).dateOfBirth,
      'Ngày sinh không hợp lệ (phải từ năm 1900 trở về sau)',
    );
    assert.equal(
      validateEmergencyIdentity({ ...validForm, dateOfBirth: '2999-01-01' }).dateOfBirth,
      'Ngày sinh không được ở tương lai',
    );
    assert.equal(
      validateEmergencyIdentity({ ...validForm, phoneNumber: '0123456789' }).phoneNumber,
      'Số điện thoại không đúng định dạng di động Việt Nam hợp lệ (VD: 09xxxxxxxx, 03xxxxxxxx)',
    );
    assert.equal(
      validateEmergencyIdentity({ ...validForm, identityCardNumber: '123' }).identityCardNumber,
      'Số CCCD phải gồm đúng 12 chữ số',
    );
    assert.equal(
      validateEmergencyIdentity({ ...validForm, privacyConfirmed: false }).privacyConfirmed,
      'Cần xác nhận đồng ý trước khi gửi',
    );
  });

  it('only exposes emergency identity errors after blur, with the identity alternative linked', () => {
    const invalidForm = {
      fullName: '',
      dateOfBirth: '',
      phoneNumber: '',
      identityCardNumber: '',
      guardianFullName: '',
      guardianPhoneNumber: '',
      privacyConfirmed: false,
    };

    assert.deepEqual(getVisibleEmergencyIdentityErrors(invalidForm, {}), {});
    const errors = getVisibleEmergencyIdentityErrors(invalidForm, { fullName: true });
    assert.equal(errors.fullName, 'Họ và tên tối thiểu 3 ký tự');
    assert.equal(errors.dateOfBirth, undefined);

    const guardianErrors = getVisibleEmergencyIdentityErrors(invalidForm, {
      guardianFullName: true,
    });
    assert.equal(
      guardianErrors.identityCardNumber,
      'Cần nhập số CCCD hợp lệ, hoặc nhập đầy đủ họ tên và số điện thoại người giám hộ/đại diện',
    );
  });
});
