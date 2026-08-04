import { describe, expect, it } from 'vitest';

import {
  diagnoseRecordSchema,
  orderLabTestsSchema,
  recordVitalSignsSchema,
  recordVitalSignsWithAssessmentSchema,
  updateClinicalAssessmentSchema,
} from '../../src/modules/medical-records/schemas/medical-record.schemas';
import {
  cancelPrescriptionSchema,
  createPrescriptionDraftSchema,
  exportPrescriptionXmlSchema,
  signPrescriptionSchema,
} from '../../src/modules/prescriptions/schemas/prescription.schemas';

const validVitalSigns = {
  pulse: 72,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  spo2: 98,
};

const validPrescriptionItem = {
  medicineId: 'medicine-1',
  quantity: 1,
  days: 1,
  dosePerUse: '1 viên',
  useTiming: 'Sau ăn',
  dosageInstruction: '1 viên, sau ăn',
};

describe('doctor vital-sign input matrix', () => {
  it.each([
    ['pulse', { pulse: undefined }, 'Vui lòng nhập mạch.'],
    [
      'bloodPressureSystolic',
      { bloodPressureSystolic: undefined },
      'Vui lòng nhập huyết áp tâm thu.',
    ],
    [
      'bloodPressureDiastolic',
      { bloodPressureDiastolic: undefined },
      'Vui lòng nhập huyết áp tâm trương.',
    ],
    ['spo2', { spo2: undefined }, 'Vui lòng nhập SpO2.'],
  ])('requires %s', (_field, override, message) => {
    const result = recordVitalSignsSchema.safeParse({ ...validVitalSigns, ...override });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toContainEqual(expect.objectContaining({ message }));
  });

  it.each([
    ['pulse', 1, 300, {}],
    ['bloodPressureSystolic', 2, 300, { bloodPressureDiastolic: 1 }],
    ['bloodPressureDiastolic', 1, 200, { bloodPressureSystolic: 201 }],
    ['spo2', 0, 100, {}],
  ])('accepts %s at its configured boundaries', (field, min, max, relatedFields) => {
    expect(
      recordVitalSignsSchema.safeParse({ ...validVitalSigns, ...relatedFields, [field]: min })
        .success,
    ).toBe(true);
    expect(
      recordVitalSignsSchema.safeParse({ ...validVitalSigns, ...relatedFields, [field]: max })
        .success,
    ).toBe(true);
  });

  it.each([
    ['pulse', 0],
    ['pulse', 301],
    ['bloodPressureSystolic', 0],
    ['bloodPressureSystolic', 301],
    ['bloodPressureDiastolic', 0],
    ['bloodPressureDiastolic', 201],
    ['spo2', -1],
    ['spo2', 101],
  ])('rejects %s outside its configured range', (field, value) => {
    expect(recordVitalSignsSchema.safeParse({ ...validVitalSigns, [field]: value }).success).toBe(
      false,
    );
  });

  it.each(['pulse', 'bloodPressureSystolic', 'bloodPressureDiastolic', 'spo2'])(
    'rejects fractional %s values',
    (field) => {
      expect(recordVitalSignsSchema.safeParse({ ...validVitalSigns, [field]: 72.5 }).success).toBe(
        false,
      );
    },
  );

  it('rejects non-numeric required vital values', () => {
    expect(recordVitalSignsSchema.safeParse({ ...validVitalSigns, pulse: '72' }).success).toBe(
      false,
    );
  });

  it('accepts optional vital fields at boundaries and rejects invalid values', () => {
    expect(
      recordVitalSignsSchema.safeParse({
        ...validVitalSigns,
        temperatureC: 25,
        respiratoryRate: 1,
        weightKg: 300,
      }).success,
    ).toBe(true);
    expect(
      recordVitalSignsSchema.safeParse({ ...validVitalSigns, temperatureC: 45, weightKg: 301 })
        .success,
    ).toBe(false);
    expect(recordVitalSignsSchema.safeParse({ ...validVitalSigns, temperatureC: 24 }).success).toBe(
      false,
    );
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
          expect.objectContaining({
            path: ['bloodPressureSystolic'],
            message: 'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.',
          }),
        );
      }
    },
  );

  it('validates measuredAt, treatmentOrderId and note limits', () => {
    expect(
      recordVitalSignsSchema.safeParse({
        ...validVitalSigns,
        measuredAt: '2026-08-04T10:00:00+07:00',
        treatmentOrderId: 'order-1',
        note: 'Theo dõi sau đo',
      }).success,
    ).toBe(true);
    expect(
      recordVitalSignsSchema.safeParse({ ...validVitalSigns, measuredAt: 'not-a-date' }).success,
    ).toBe(false);
    expect(
      recordVitalSignsSchema.safeParse({ ...validVitalSigns, note: 'x'.repeat(501) }).success,
    ).toBe(false);
  });
});

describe('clinical assessment and atomic payload matrix', () => {
  it('requires a positive integer expected version', () => {
    expect(updateClinicalAssessmentSchema.safeParse({ expectedVersion: 1 }).success).toBe(true);
    expect(updateClinicalAssessmentSchema.safeParse({ expectedVersion: 0 }).success).toBe(false);
    expect(updateClinicalAssessmentSchema.safeParse({ expectedVersion: 1.5 }).success).toBe(false);
  });

  it('enforces height, weight, lesion area and text boundaries', () => {
    expect(
      updateClinicalAssessmentSchema.safeParse({
        expectedVersion: 1,
        heightCm: 250,
        weightKg: 300,
        bodySurfaceAreaPercent: 0,
        skinLesionLocation: 'x'.repeat(500),
      }).success,
    ).toBe(true);
    expect(
      updateClinicalAssessmentSchema.safeParse({ expectedVersion: 1, heightCm: 251 }).success,
    ).toBe(false);
    expect(
      updateClinicalAssessmentSchema.safeParse({ expectedVersion: 1, weightKg: 301 }).success,
    ).toBe(false);
    expect(
      updateClinicalAssessmentSchema.safeParse({ expectedVersion: 1, bodySurfaceAreaPercent: 101 })
        .success,
    ).toBe(false);
    expect(
      updateClinicalAssessmentSchema.safeParse({
        expectedVersion: 1,
        skinLesionLocation: 'x'.repeat(501),
      }).success,
    ).toBe(false);
  });

  it('accepts every supported lesion type and rejects unknown values', () => {
    const lesionTypes = [
      'macule',
      'papule',
      'plaque',
      'vesicle',
      'bulla',
      'pustule',
      'nodule',
      'wheal',
      'scale',
      'crust',
      'erosion',
      'ulcer',
      'atrophy',
      'lichenification',
    ];

    expect(
      updateClinicalAssessmentSchema.safeParse({ expectedVersion: 1, skinLesionTypes: lesionTypes })
        .success,
    ).toBe(true);
    expect(
      updateClinicalAssessmentSchema.safeParse({ expectedVersion: 1, skinLesionTypes: ['unknown'] })
        .success,
    ).toBe(false);
  });

  it('requires both vital and assessment contracts for the atomic command', () => {
    expect(
      recordVitalSignsWithAssessmentSchema.safeParse({
        ...validVitalSigns,
        expectedVersion: 1,
        chiefComplaint: 'Đau đầu',
        heightCm: 170,
      }).success,
    ).toBe(true);
    expect(
      recordVitalSignsWithAssessmentSchema.safeParse({
        ...validVitalSigns,
        expectedVersion: 1,
      }).success,
    ).toBe(false);
    expect(
      recordVitalSignsWithAssessmentSchema.safeParse({
        ...validVitalSigns,
        chiefComplaint: 'Đau đầu',
      }).success,
    ).toBe(false);
    expect(
      recordVitalSignsWithAssessmentSchema.safeParse({
        expectedVersion: 1,
        chiefComplaint: 'Đau đầu',
      }).success,
    ).toBe(false);
  });
});

describe('lab-order and diagnosis input matrix', () => {
  it('accepts one to twenty lab orders and rejects empty or oversized batches', () => {
    const item = { labTestTypeId: 'lab-1' };
    expect(orderLabTestsSchema.safeParse({ expectedRecordVersion: 1, items: [item] }).success).toBe(
      true,
    );
    expect(
      orderLabTestsSchema.safeParse({
        expectedRecordVersion: 1,
        items: Array.from({ length: 20 }, (_, index) => ({ labTestTypeId: `lab-${index}` })),
      }).success,
    ).toBe(true);
    expect(orderLabTestsSchema.safeParse({ expectedRecordVersion: 1, items: [] }).success).toBe(
      false,
    );
    expect(
      orderLabTestsSchema.safeParse({
        expectedRecordVersion: 1,
        items: Array.from({ length: 21 }, (_, index) => ({ labTestTypeId: `lab-${index}` })),
      }).success,
    ).toBe(false);
  });

  it('validates lab order item fields and version boundaries', () => {
    expect(
      orderLabTestsSchema.safeParse({
        expectedRecordVersion: 1,
        items: [
          { labTestTypeId: 'lab-1', isUrgent: true, specimenType: 'Máu', method: 'Định lượng' },
        ],
      }).success,
    ).toBe(true);
    expect(
      orderLabTestsSchema.safeParse({
        expectedRecordVersion: 0,
        items: [{ labTestTypeId: 'lab-1' }],
      }).success,
    ).toBe(false);
    expect(
      orderLabTestsSchema.safeParse({ expectedRecordVersion: 1, items: [{ labTestTypeId: '' }] })
        .success,
    ).toBe(false);
    expect(
      orderLabTestsSchema.safeParse({
        expectedRecordVersion: 1,
        items: [{ labTestTypeId: 'lab-1', specimenType: 'x'.repeat(101) }],
      }).success,
    ).toBe(false);
  });

  it('requires valid ICD, diagnosis text, treatment type and signature confirmation', () => {
    const valid = {
      expectedVersion: 1,
      icd10: 'J45.0',
      diagnosisText: 'Hen phế quản',
      treatmentType: 'outpatient' as const,
      signatureConfirmation: true as const,
      signatureMethod: 'dev_e_confirmation' as const,
    };

    expect(diagnoseRecordSchema.safeParse(valid).success).toBe(true);
    expect(diagnoseRecordSchema.safeParse({ ...valid, icd10: '' }).success).toBe(false);
    expect(diagnoseRecordSchema.safeParse({ ...valid, icd10: '12345678901' }).success).toBe(false);
    expect(diagnoseRecordSchema.safeParse({ ...valid, diagnosisText: ' ' }).success).toBe(false);
    expect(
      diagnoseRecordSchema.safeParse({ ...valid, diagnosisText: 'x'.repeat(1001) }).success,
    ).toBe(false);
    expect(diagnoseRecordSchema.safeParse({ ...valid, treatmentType: 'invalid' }).success).toBe(
      false,
    );
    expect(diagnoseRecordSchema.safeParse({ ...valid, signatureConfirmation: false }).success).toBe(
      false,
    );
    expect(diagnoseRecordSchema.safeParse({ ...valid, signatureMethod: 'manual' }).success).toBe(
      false,
    );
  });
});

describe('prescription command input matrix', () => {
  it('accepts valid prescription item boundaries and rejects invalid quantity/duration', () => {
    expect(
      createPrescriptionDraftSchema.safeParse({
        expectedRecordVersion: 1,
        items: [{ ...validPrescriptionItem, quantity: 1, days: 1 }],
      }).success,
    ).toBe(true);
    expect(
      createPrescriptionDraftSchema.safeParse({
        expectedRecordVersion: 1,
        items: [{ ...validPrescriptionItem, quantity: 0 }],
      }).success,
    ).toBe(false);
    expect(
      createPrescriptionDraftSchema.safeParse({
        expectedRecordVersion: 1,
        items: [{ ...validPrescriptionItem, quantity: 1.5 }],
      }).success,
    ).toBe(false);
    expect(
      createPrescriptionDraftSchema.safeParse({
        expectedRecordVersion: 1,
        items: [{ ...validPrescriptionItem, days: 0 }],
      }).success,
    ).toBe(false);
    expect(
      createPrescriptionDraftSchema.safeParse({
        expectedRecordVersion: 1,
        items: [{ ...validPrescriptionItem, days: 91 }],
      }).success,
    ).toBe(false);
  });

  it('rejects blank or separator-only dosage instructions and enforces lengths', () => {
    for (const dosageInstruction of ['', '   ', ',', ' ,  ']) {
      expect(
        createPrescriptionDraftSchema.safeParse({
          expectedRecordVersion: 1,
          items: [{ ...validPrescriptionItem, dosageInstruction }],
        }).success,
      ).toBe(false);
    }
    expect(
      createPrescriptionDraftSchema.safeParse({
        expectedRecordVersion: 1,
        items: [{ ...validPrescriptionItem, dosePerUse: 'x'.repeat(51) }],
      }).success,
    ).toBe(false);
    expect(
      createPrescriptionDraftSchema.safeParse({
        expectedRecordVersion: 1,
        items: [{ ...validPrescriptionItem, useTiming: 'x'.repeat(101) }],
      }).success,
    ).toBe(false);
    expect(
      createPrescriptionDraftSchema.safeParse({
        expectedRecordVersion: 1,
        items: [{ ...validPrescriptionItem, dosageInstruction: 'x'.repeat(501) }],
      }).success,
    ).toBe(false);
  });

  it.each(['dosePerUse', 'useTiming'])('requires %s for every medicine line', (field) => {
    expect(
      createPrescriptionDraftSchema.safeParse({
        expectedRecordVersion: 1,
        items: [{ ...validPrescriptionItem, [field]: '' }],
      }).success,
    ).toBe(false);
    expect(
      createPrescriptionDraftSchema.safeParse({
        expectedRecordVersion: 1,
        items: [{ ...validPrescriptionItem, [field]: undefined }],
      }).success,
    ).toBe(false);
  });

  it('enforces prescription batch, version and explicit no-drug fields', () => {
    expect(
      createPrescriptionDraftSchema.safeParse({ expectedRecordVersion: 1, items: [] }).success,
    ).toBe(true);
    expect(
      createPrescriptionDraftSchema.safeParse({
        expectedRecordVersion: 1,
        items: Array.from({ length: 20 }, () => validPrescriptionItem),
      }).success,
    ).toBe(true);
    expect(
      createPrescriptionDraftSchema.safeParse({
        expectedRecordVersion: 1,
        items: Array.from({ length: 21 }, () => validPrescriptionItem),
      }).success,
    ).toBe(false);
    expect(
      createPrescriptionDraftSchema.safeParse({ expectedRecordVersion: 0, items: [] }).success,
    ).toBe(false);
    expect(
      createPrescriptionDraftSchema.safeParse({
        expectedRecordVersion: 1,
        items: [],
        noDrugConfirmation: true,
      }).success,
    ).toBe(true);
    expect(
      createPrescriptionDraftSchema.safeParse({
        expectedRecordVersion: 1,
        items: [],
        noDrugConfirmation: 'true',
      }).success,
    ).toBe(false);
  });

  it('requires explicit confirmation and positive versions for sign, cancel and XML export', () => {
    expect(
      signPrescriptionSchema.safeParse({
        expectedVersion: 1,
        signatureConfirmation: true,
        signatureMethod: 'dev_e_confirmation',
      }).success,
    ).toBe(true);
    expect(
      signPrescriptionSchema.safeParse({
        expectedVersion: 0,
        signatureConfirmation: true,
        signatureMethod: 'dev_e_confirmation',
      }).success,
    ).toBe(false);
    expect(
      signPrescriptionSchema.safeParse({
        expectedVersion: 1,
        signatureConfirmation: false,
        signatureMethod: 'dev_e_confirmation',
      }).success,
    ).toBe(false);
    expect(
      cancelPrescriptionSchema.safeParse({ expectedVersion: 1, cancelReason: 'Hủy theo yêu cầu' })
        .success,
    ).toBe(true);
    expect(
      cancelPrescriptionSchema.safeParse({ expectedVersion: 1, cancelReason: '' }).success,
    ).toBe(false);
    expect(
      cancelPrescriptionSchema.safeParse({ expectedVersion: 1, cancelReason: 'x'.repeat(501) })
        .success,
    ).toBe(false);
    expect(exportPrescriptionXmlSchema.safeParse({ expectedVersion: 1 }).success).toBe(true);
    expect(exportPrescriptionXmlSchema.safeParse({ expectedVersion: 0 }).success).toBe(false);
  });
});
