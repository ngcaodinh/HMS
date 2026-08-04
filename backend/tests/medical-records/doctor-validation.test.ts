import { describe, expect, it } from 'vitest';

import {
  diagnoseRecordSchema,
  recordVitalSignsSchema,
  recordVitalSignsWithAssessmentSchema,
  updateClinicalAssessmentSchema,
} from '../../src/modules/medical-records/schemas/medical-record.schemas';
import { isChronicDiseaseCode } from '../../src/modules/prescriptions/constants/chronic-disease-catalog';
import { createPrescriptionDraftSchema } from '../../src/modules/prescriptions/schemas/prescription.schemas';

describe('doctor medical-record validation', () => {
  it('rejects a systolic pressure that is not greater than diastolic pressure', () => {
    const result = recordVitalSignsSchema.safeParse({
      pulse: 72,
      bloodPressureSystolic: 80,
      bloodPressureDiastolic: 80,
      spo2: 98,
      weightKg: 60,
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
  });

  it('rejects weight above the clinical maximum with a Vietnamese rule', () => {
    const result = recordVitalSignsSchema.safeParse({
      pulse: 72,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      spo2: 98,
      weightKg: 301,
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Cân nặng tối đa 300kg.');
  });

  it('accepts only the supported skin lesion type whitelist', () => {
    expect(
      updateClinicalAssessmentSchema.safeParse({
        expectedVersion: 1,
        skinLesionTypes: ['macule', 'lichenification'],
      }).success,
    ).toBe(true);
    expect(
      updateClinicalAssessmentSchema.safeParse({
        expectedVersion: 1,
        skinLesionTypes: ['unknown'],
      }).success,
    ).toBe(false);
  });

  it('rejects a dosage instruction made only of separators', () => {
    const result = createPrescriptionDraftSchema.safeParse({
      expectedRecordVersion: 1,
      items: [
        {
          medicineId: 'medicine-1',
          quantity: 1,
          days: 1,
          dosePerUse: '1 viên',
          useTiming: 'Sau ăn',
          dosageInstruction: ' ,  ',
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0]?.message).toBe('Cách dùng thuốc không hợp lệ.');
  });

  it('requires an explicit treatment type when signing a diagnosis', () => {
    const result = diagnoseRecordSchema.safeParse({
      expectedVersion: 1,
      icd10: 'J45.0',
      diagnosisText: 'Hen phế quản',
      signatureConfirmation: true,
      signatureMethod: 'dev_e_confirmation',
    });

    expect(result.success).toBe(false);
  });

  it('accepts the atomic doctor payload without leaking vital fields into assessment validation', () => {
    const result = recordVitalSignsWithAssessmentSchema.safeParse({
      expectedVersion: 1,
      pulse: 72,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      spo2: 98,
      chiefComplaint: 'Đau đầu',
      heightCm: 170,
      historyOfPresentIllness: 'Đau đầu từ sáng.',
    });

    expect(result.success).toBe(true);
  });
});

describe('chronic disease catalog', () => {
  it('allows a catalogued chronic code and rejects a non-chronic doctor code', () => {
    expect(isChronicDiseaseCode('J45.0')).toBe(true);
    expect(isChronicDiseaseCode('L50.0')).toBe(false);
  });
});
