/** Bảo vệ invariant điều dưỡng: sinh hiệu, dị ứng và định danh cấp cứu phải đủ trước khi ghi. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getAllergyNoteError,
  getAllVitalFieldErrors,
  getBloodPressureRelationError,
  getMissingRequiredVitalFields,
  hasBlockingVitalFormErrors,
  getVisibleEmergencyIdentityErrors,
  getVitalFieldError,
  parseVitalNumber,
  validateEmergencyIdentity,
} from '../src/modules/nurse/pages/workspace/nurse-validation';

describe('nurse vitals validation helpers', () => {
  it('matches the doctor form boundaries and accepts decimal values', () => {
    const boundaries = [
      ['pulse', '30', '220'],
      ['temperatureC', '34', '43'],
      ['bpSystolic', '50', '280'],
      ['bpDiastolic', '20', '180'],
      ['respiratoryRate', '1', '80'],
      ['spo2', '50', '100'],
      ['heightCm', '40', '250'],
      ['weightKg', '1', '300'],
    ] as const;

    for (const [field, min, max] of boundaries) {
      assert.equal(getVitalFieldError(field, min), undefined);
      assert.equal(getVitalFieldError(field, max), undefined);
    }
    assert.equal(getVitalFieldError('pulse', '72.5'), undefined);
    assert.equal(getVitalFieldError('bpSystolic', '120,5'), undefined);
    assert.equal(parseVitalNumber(' 120,5 '), 120.5);
  });

  it('rejects values outside the doctor form range and invalid numbers', () => {
    const invalidValues = [
      ['pulse', '29'],
      ['pulse', '221'],
      ['temperatureC', '33.9'],
      ['temperatureC', '43.1'],
      ['bpSystolic', '49'],
      ['bpSystolic', '281'],
      ['bpDiastolic', '19'],
      ['bpDiastolic', '181'],
      ['respiratoryRate', '0'],
      ['respiratoryRate', '81'],
      ['spo2', '49'],
      ['spo2', '101'],
      ['heightCm', '39.9'],
      ['heightCm', '250.1'],
      ['weightKg', '0.9'],
      ['weightKg', '300.1'],
      ['pulse', 'not-a-number'],
    ] as const;

    for (const [field, value] of invalidValues) {
      assert.notEqual(getVitalFieldError(field, value), undefined, `${field}=${value}`);
    }
    assert.equal(getVitalFieldError('pulse', ''), 'Trường này không được để trống.');
    assert.equal(getVitalFieldError('heightCm', ''), undefined);
  });

  it('rejects reversed blood pressure values and long allergy notes', () => {
    assert.equal(
      getBloodPressureRelationError('80', '120'),
      'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.',
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

  it('shows both blood-pressure errors only when both fields are valid numbers', () => {
    const relationErrors = getAllVitalFieldErrors({
      bpSystolic: '80',
      bpDiastolic: '120',
    });
    assert.equal(relationErrors.bpSystolic, getBloodPressureRelationError('80', '120'));
    assert.equal(relationErrors.bpDiastolic, getBloodPressureRelationError('80', '120'));

    const fieldErrors = getAllVitalFieldErrors({
      bpSystolic: '49',
      bpDiastolic: '80',
    });
    assert.equal(fieldErrors.bpSystolic, getVitalFieldError('bpSystolic', '49'));
    assert.equal(fieldErrors.bpDiastolic, undefined);
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
