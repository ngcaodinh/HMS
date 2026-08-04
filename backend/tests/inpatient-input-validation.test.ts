import { describe, expect, it } from 'vitest';

import {
  assignBedSchema,
  cancelOrderSchema,
  changeBedAssignmentSchema,
  createOrderSchema,
  dischargePatientSchema,
  recordVitalSignsSchema,
  signDischargeSummarySchema,
  standardizeEmergencyIdentitySchema,
  updateOrderStatusSchema,
} from '../src/modules/inpatient/schemas/inpatient.schema';
import {
  createSpecimenSchema,
  handoffSpecimenSchema,
} from '../src/modules/specimens/schemas/specimen.schema';

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

describe('nurse vital-sign validation matrix', () => {
  const boundaryCases = [
    ['pulse', 1, 300],
    ['bloodPressureSystolic', 1, 300],
    ['bloodPressureDiastolic', 1, 200],
    ['respiratoryRate', 1, 100],
    ['heightCm', 0.1, 300],
    ['weightKg', 0.1, 500],
    ['temperatureC', 25, 45],
    ['spo2', 0, 100],
  ] as const;

  it.each(boundaryCases)(
    'accepts %s at both configured boundaries when cross-fields permit it',
    (field, min, max) => {
      const makePayload = (value: number) => ({
        ...validVitalSigns,
        bloodPressureDiastolic:
          field === 'bloodPressureSystolic' ? 1 : field === 'bloodPressureDiastolic' ? value : 80,
        bloodPressureSystolic:
          field === 'bloodPressureDiastolic'
            ? value + 1
            : field === 'bloodPressureSystolic'
              ? value
              : 120,
        [field]: value,
      });

      const lowResult = recordVitalSignsSchema.safeParse(makePayload(min));
      const highResult = recordVitalSignsSchema.safeParse(makePayload(max));

      if (field === 'bloodPressureSystolic' && min === 1) {
        expect(lowResult.success).toBe(false);
        expect(highResult.success).toBe(true);
        return;
      }

      expect(lowResult.success).toBe(true);
      expect(highResult.success).toBe(true);
    },
  );

  it.each([
    ['pulse', 0, 301],
    ['bloodPressureSystolic', 0, 301],
    ['bloodPressureDiastolic', 0, 201],
    ['respiratoryRate', 0, 101],
    ['heightCm', 0, 300.1],
    ['weightKg', 0, 500.1],
    ['temperatureC', 24.9, 45.1],
    ['spo2', -1, 101],
  ] as const)('rejects %s immediately outside its configured range', (field, below, above) => {
    expect(recordVitalSignsSchema.safeParse({ ...validVitalSigns, [field]: below }).success).toBe(
      false,
    );
    expect(recordVitalSignsSchema.safeParse({ ...validVitalSigns, [field]: above }).success).toBe(
      false,
    );
  });

  it.each([
    'pulse',
    'bloodPressureSystolic',
    'bloodPressureDiastolic',
    'respiratoryRate',
    'spo2',
  ] as const)('rejects fractional %s values because the database stores an integer', (field) => {
    expect(recordVitalSignsSchema.safeParse({ ...validVitalSigns, [field]: 72.5 }).success).toBe(
      false,
    );
  });

  it('accepts omitted optional fields and rejects an oversized allergy description', () => {
    expect(recordVitalSignsSchema.safeParse(validVitalSigns).success).toBe(true);
    expect(
      recordVitalSignsSchema.safeParse({ ...validVitalSigns, allergies: 'A'.repeat(1000) }).success,
    ).toBe(true);
    expect(
      recordVitalSignsSchema.safeParse({ ...validVitalSigns, allergies: 'A'.repeat(1001) }).success,
    ).toBe(false);
  });

  it.each([
    [120, 120],
    [80, 120],
  ])(
    'rejects systolic pressure %s when it is not greater than diastolic %s',
    (systolic, diastolic) => {
      const result = recordVitalSignsSchema.safeParse({
        ...validVitalSigns,
        bloodPressureSystolic: systolic,
        bloodPressureDiastolic: diastolic,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({ path: ['bloodPressureSystolic'] }),
        );
      }
    },
  );

  it('rejects missing required vital fields and non-numeric payloads', () => {
    for (const field of [
      'ticketId',
      'expectedRecordVersion',
      'pulse',
      'bloodPressureSystolic',
      'bloodPressureDiastolic',
      'spo2',
    ]) {
      expect(
        recordVitalSignsSchema.safeParse({ ...validVitalSigns, [field]: undefined }).success,
      ).toBe(false);
    }
    expect(recordVitalSignsSchema.safeParse({ ...validVitalSigns, pulse: '80' }).success).toBe(
      false,
    );
  });
});

describe('emergency identity validation matrix', () => {
  const validWithIdentityCard = {
    ...validEmergencyIdentity,
    identityCardNumber: '001234567890',
  };

  const futureDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  };

  it('accepts legal boundary lengths and a date of birth of today', () => {
    expect(
      standardizeEmergencyIdentitySchema.safeParse({
        ...validWithIdentityCard,
        fullName: 'A'.repeat(255),
        guardianFullName: 'B'.repeat(255),
        dateOfBirth: new Date().toISOString().slice(0, 10),
        address: 'C'.repeat(500),
        healthInsuranceCode: 'D'.repeat(20),
      }).success,
    ).toBe(true);
  });

  it('rejects missing and overlong required or bounded fields', () => {
    for (const field of ['fullName', 'dateOfBirth', 'gender', 'phoneNumber', 'privacyConfirmed']) {
      expect(
        standardizeEmergencyIdentitySchema.safeParse({
          ...validWithIdentityCard,
          [field]: undefined,
        }).success,
      ).toBe(false);
    }
    expect(
      standardizeEmergencyIdentitySchema.safeParse({
        ...validWithIdentityCard,
        fullName: 'A'.repeat(256),
        address: 'B'.repeat(501),
        healthInsuranceCode: 'C'.repeat(21),
      }).success,
    ).toBe(false);
  });

  it('rejects invalid phone, gender, privacy confirmation and malformed CCCD', () => {
    expect(
      standardizeEmergencyIdentitySchema.safeParse({
        ...validWithIdentityCard,
        phoneNumber: '0123456789',
      }).success,
    ).toBe(false);
    expect(
      standardizeEmergencyIdentitySchema.safeParse({ ...validWithIdentityCard, gender: 'other' })
        .success,
    ).toBe(false);
    expect(
      standardizeEmergencyIdentitySchema.safeParse({
        ...validWithIdentityCard,
        privacyConfirmed: false,
      }).success,
    ).toBe(false);
    for (const identityCardNumber of ['12345678901', '1234567890123', 'ABCDEFGHIJKL']) {
      expect(
        standardizeEmergencyIdentitySchema.safeParse({
          ...validEmergencyIdentity,
          identityCardNumber,
          guardianFullName: 'NGUYỄN THỊ B',
          guardianPhoneNumber: '0912345678',
        }).success,
      ).toBe(false);
    }
  });

  it('accepts 1900 as the oldest supported birth year and rejects invalid dates', () => {
    expect(
      standardizeEmergencyIdentitySchema.safeParse({
        ...validWithIdentityCard,
        dateOfBirth: '1900-01-01',
      }).success,
    ).toBe(true);
    expect(
      standardizeEmergencyIdentitySchema.safeParse({
        ...validWithIdentityCard,
        dateOfBirth: '1899-12-31',
      }).success,
    ).toBe(false);
    expect(
      standardizeEmergencyIdentitySchema.safeParse({
        ...validWithIdentityCard,
        dateOfBirth: futureDate(),
      }).success,
    ).toBe(false);
    expect(
      standardizeEmergencyIdentitySchema.safeParse({
        ...validWithIdentityCard,
        dateOfBirth: 'not-a-date',
      }).success,
    ).toBe(false);
  });

  it.each([
    { guardianFullName: 'NGUYỄN THỊ B', guardianPhoneNumber: undefined },
    { guardianFullName: undefined, guardianPhoneNumber: '0912345678' },
    { guardianFullName: 'NGUYỄN THỊ B', guardianPhoneNumber: '0123456789' },
  ])('requires a complete and valid guardian alternative: %o', (guardian) => {
    const result = standardizeEmergencyIdentitySchema.safeParse({
      ...validEmergencyIdentity,
      ...guardian,
    });

    expect(result.success).toBe(false);
  });
});

describe('inpatient mutation schema matrix', () => {
  const validAssignBed = { bedId: 'bed-1', expectedRecordVersion: 1 };
  const validChangeBed = {
    targetBedId: 'bed-2',
    expectedRecordVersion: 1,
    action: 'transfer' as const,
    reason: 'Chuyển người bệnh sang buồng phù hợp',
  };

  it('covers bed assignment, transfer reason and order text limits', () => {
    expect(assignBedSchema.safeParse({ ...validAssignBed, note: 'A'.repeat(255) }).success).toBe(
      true,
    );
    expect(assignBedSchema.safeParse({ ...validAssignBed, note: 'A'.repeat(256) }).success).toBe(
      false,
    );
    expect(assignBedSchema.safeParse({ bedId: '', expectedRecordVersion: 1 }).success).toBe(false);
    expect(
      assignBedSchema.safeParse({ ...validAssignBed, expectedRecordVersion: 1.5 }).success,
    ).toBe(false);

    expect(changeBedAssignmentSchema.safeParse(validChangeBed).success).toBe(true);
    expect(
      changeBedAssignmentSchema.safeParse({ ...validChangeBed, action: 'invalid' }).success,
    ).toBe(false);
    expect(changeBedAssignmentSchema.safeParse({ ...validChangeBed, reason: 'ngắn' }).success).toBe(
      false,
    );
    expect(
      changeBedAssignmentSchema.safeParse({ ...validChangeBed, reason: 'A'.repeat(255) }).success,
    ).toBe(true);
    expect(
      changeBedAssignmentSchema.safeParse({ ...validChangeBed, reason: 'A'.repeat(256) }).success,
    ).toBe(false);

    for (const orderType of ['medication', 'monitoring', 'care', 'diet', 'procedure'] as const) {
      expect(
        createOrderSchema.safeParse({
          orderType,
          content: 'A'.repeat(1000),
          note: 'B'.repeat(500),
        }).success,
      ).toBe(true);
    }
    expect(createOrderSchema.safeParse({ orderType: 'invalid', content: 'x' }).success).toBe(false);
    expect(createOrderSchema.safeParse({ orderType: 'care', content: '' }).success).toBe(false);
    expect(
      createOrderSchema.safeParse({ orderType: 'care', content: 'A'.repeat(1001) }).success,
    ).toBe(false);
    expect(
      createOrderSchema.safeParse({ orderType: 'care', content: 'x', note: 'A'.repeat(501) })
        .success,
    ).toBe(false);
  });

  it('covers order status, cancellation and discharge confirmation contracts', () => {
    for (const status of ['done', 'cancelled', 'delayed', 'active'] as const) {
      expect(updateOrderStatusSchema.safeParse({ status }).success).toBe(true);
    }
    expect(updateOrderStatusSchema.safeParse({ status: 'invalid' }).success).toBe(false);
    expect(
      updateOrderStatusSchema.safeParse({ status: 'cancelled', cancelReason: 'A'.repeat(501) })
        .success,
    ).toBe(false);
    expect(cancelOrderSchema.safeParse({ cancelReason: 'x' }).success).toBe(true);
    expect(cancelOrderSchema.safeParse({ cancelReason: '' }).success).toBe(false);
    expect(cancelOrderSchema.safeParse({ cancelReason: 'A'.repeat(500) }).success).toBe(true);
    expect(cancelOrderSchema.safeParse({ cancelReason: 'A'.repeat(501) }).success).toBe(false);

    expect(
      signDischargeSummarySchema.safeParse({
        dischargeDiagnosis: 'Ổn định',
        treatmentSummary: 'Đã điều trị ổn định',
        dischargeCondition: 'Tỉnh táo',
        signatureConfirmation: true,
      }).success,
    ).toBe(true);
    expect(
      signDischargeSummarySchema.safeParse({
        dischargeDiagnosis: 'Ổn định',
        treatmentSummary: 'Đã điều trị ổn định',
        dischargeCondition: 'Tỉnh táo',
        signatureConfirmation: false,
      }).success,
    ).toBe(false);
    expect(
      dischargePatientSchema.safeParse({ expectedRecordVersion: 1, dischargeConfirmation: true })
        .success,
    ).toBe(true);
    expect(
      dischargePatientSchema.safeParse({ expectedRecordVersion: 1, dischargeConfirmation: false })
        .success,
    ).toBe(false);
  });
});

describe('specimen mutation schema matrix', () => {
  const validSpecimen = {
    recordId: 'record-1',
    patientCode: 'BN001',
    patientName: 'Nguyễn Văn A',
    departmentName: 'Nội trú',
    specimenCode: 'SP001',
    specimenType: 'Máu',
    orderDescription: 'Công thức máu',
  };

  it('requires every specimen field and applies the priority default', () => {
    const result = createSpecimenSchema.safeParse(validSpecimen);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe(false);

    for (const field of Object.keys(validSpecimen)) {
      expect(createSpecimenSchema.safeParse({ ...validSpecimen, [field]: '' }).success).toBe(false);
    }
    expect(createSpecimenSchema.safeParse({ ...validSpecimen, priority: true }).success).toBe(true);
  });

  it('allows the current optional handoff receiver contract', () => {
    expect(handoffSpecimenSchema.safeParse({}).success).toBe(true);
    expect(handoffSpecimenSchema.safeParse({ labReceiverName: 'Phòng Lab Central' }).success).toBe(
      true,
    );
  });
});
