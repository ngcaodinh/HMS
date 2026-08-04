import { describe, expect, it } from 'vitest';

import {
  recordVitalSignsSchema,
  standardizeEmergencyIdentitySchema,
} from '../src/modules/inpatient/schemas/inpatient.schema';

const validVitalSigns = {
  ticketId: 'ticket-1',
  expectedRecordVersion: 1,
  pulse: 80,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  spo2: 98,
};

const validEmergencyIdentity = {
  fullName: 'NGUYỄN VĂN A',
  dateOfBirth: '1990-01-01',
  gender: 'male' as const,
  phoneNumber: '0901234567',
  privacyConfirmed: true as const,
};

describe('inpatient input validation', () => {
  it('rejects vital values outside the database-safe ranges', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validVitalSigns,
      pulse: 0,
      bloodPressureDiastolic: 250,
      respiratoryRate: 101,
      heightCm: 0,
      weightKg: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.pulse).toContain(
        'Mạch phải trong khoảng 1-300 lần/phút',
      );
      expect(result.error.flatten().fieldErrors.bloodPressureDiastolic).toContain(
        'Huyết áp tâm trương phải trong khoảng 1-200 mmHg',
      );
      expect(result.error.flatten().fieldErrors.respiratoryRate).toContain(
        'Nhịp thở phải trong khoảng 1-100 lần/phút',
      );
      expect(result.error.flatten().fieldErrors.heightCm).toContain(
        'Chiều cao phải lớn hơn 0 và không quá 300cm',
      );
      expect(result.error.flatten().fieldErrors.weightKg).toContain(
        'Cân nặng phải lớn hơn 0 và không quá 500kg',
      );
    }
  });

  it('rejects systolic pressure that is not greater than diastolic pressure', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validVitalSigns,
      bloodPressureSystolic: 80,
      bloodPressureDiastolic: 120,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.bloodPressureSystolic).toContain(
        'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương, vui lòng kiểm tra lại (có thể đã nhập ngược)',
      );
    }
  });

  it('accepts emergency identity without CCCD when guardian details are complete', () => {
    const result = standardizeEmergencyIdentitySchema.safeParse({
      ...validEmergencyIdentity,
      guardianFullName: 'NGUYỄN THỊ B',
      guardianPhoneNumber: '0912345678',
    });

    expect(result.success).toBe(true);
  });

  it('accepts emergency identity with a valid CCCD without guardian details', () => {
    const result = standardizeEmergencyIdentitySchema.safeParse({
      ...validEmergencyIdentity,
      identityCardNumber: '001234567890',
    });

    expect(result.success).toBe(true);
  });

  it('requires either a valid CCCD or a complete guardian pair', () => {
    const result = standardizeEmergencyIdentitySchema.safeParse(validEmergencyIdentity);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual({
        code: 'custom',
        path: ['identityCardNumber'],
        message:
          'Cần nhập số CCCD hợp lệ, hoặc nhập đầy đủ họ tên và số điện thoại người giám hộ/đại diện',
      });
    }
  });

  it('rejects an emergency birth date before 1900 and an overlong guardian name', () => {
    const result = standardizeEmergencyIdentitySchema.safeParse({
      ...validEmergencyIdentity,
      identityCardNumber: '001234567890',
      dateOfBirth: '1899-12-31',
      guardianFullName: 'A'.repeat(256),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.dateOfBirth).toContain(
        'Ngày sinh không hợp lệ (phải từ năm 1900 trở về sau)',
      );
      expect(result.error.flatten().fieldErrors.guardianFullName).toContain(
        'Họ tên người bảo hộ tối đa 255 ký tự',
      );
    }
  });
});
