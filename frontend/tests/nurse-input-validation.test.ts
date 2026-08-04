import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getAllergyNoteError,
  getBloodPressureRelationError,
  getVitalFieldError,
  validateEmergencyIdentity,
} from '../src/modules/nurse/pages/workspace/nurse-validation';

describe('nurse vitals validation helpers', () => {
  it('matches the backend-safe vital boundaries', () => {
    assert.equal(getVitalFieldError('pulse', '0'), 'Mạch phải trong khoảng 1-300 lần/phút');
    assert.equal(
      getVitalFieldError('bpDiastolic', '250'),
      'Huyết áp tâm trương phải trong khoảng 1-200 mmHg',
    );
    assert.equal(
      getVitalFieldError('respiratoryRate', '101'),
      'Nhịp thở phải trong khoảng 1-100 lần/phút',
    );
    assert.equal(getVitalFieldError('weightKg', '0'), 'Cân nặng phải lớn hơn 0 và không quá 500kg');
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
});
