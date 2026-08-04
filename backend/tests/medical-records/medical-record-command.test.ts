import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createLabTestOrders: vi.fn(),
  diagnoseRecord: vi.fn(),
  findActiveLabTestType: vi.fn(),
  findActivePrescriptionForRecord: vi.fn(),
  findMedicalRecordById: vi.fn(),
  saveVitalSignsAndAssessment: vi.fn(),
  updateClinicalAssessment: vi.fn(),
  createVitalSignLogAndSnapshot: vi.fn(),
  recordAuditLog: vi.fn(),
  findIcd10ByCode: vi.fn(),
}));

vi.mock('../../src/modules/medical-records/repositories/medical-record.repository', () => ({
  createLabTestOrders: mocks.createLabTestOrders,
  diagnoseRecord: mocks.diagnoseRecord,
  findActiveLabTestType: mocks.findActiveLabTestType,
  findActivePrescriptionForRecord: mocks.findActivePrescriptionForRecord,
  findMedicalRecordById: mocks.findMedicalRecordById,
  saveVitalSignsAndAssessment: mocks.saveVitalSignsAndAssessment,
  updateClinicalAssessment: mocks.updateClinicalAssessment,
}));
vi.mock('../../src/modules/medical-records/repositories/vital-sign.repository', () => ({
  createVitalSignLogAndSnapshot: mocks.createVitalSignLogAndSnapshot,
}));
vi.mock('../../src/modules/audit/services/audit.service', () => ({
  recordAuditLog: mocks.recordAuditLog,
}));
vi.mock('../../src/modules/medical-records/constants/icd10-catalog', () => ({
  findIcd10ByCode: mocks.findIcd10ByCode,
}));

import {
  diagnoseMedicalRecord,
  orderLabTests,
  recordVitalSigns,
  recordVitalSignsAndAssessment,
} from '../../src/modules/medical-records/services/medical-record-command.service';

const record = {
  doctorId: 'doctor-1',
  status: 'diagnosed',
  treatmentType: 'outpatient',
};

const input = {
  expectedVersion: 4,
  icd10: 'J45.0',
  diagnosisText: 'Hen phế quản',
  treatmentType: 'inpatient' as const,
  signatureConfirmation: true as const,
  signatureMethod: 'dev_e_confirmation' as const,
};

describe('diagnoseMedicalRecord treatment transition gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks inpatient transition when any signed outpatient prescription exists', async () => {
    mocks.findIcd10ByCode.mockReturnValue({ code: 'J45.0' });
    mocks.findMedicalRecordById.mockResolvedValue(record);
    mocks.findActivePrescriptionForRecord.mockResolvedValue({ id: 'prescription-1' });

    await expect(diagnoseMedicalRecord('record-1', 'doctor-1', input)).rejects.toMatchObject({
      code: 'PRESCRIPTION_EXISTS_CANNOT_CHANGE_TREATMENT_TYPE',
    });
    expect(mocks.diagnoseRecord).not.toHaveBeenCalled();
  });

  it('allows the transition when no signed prescription exists', async () => {
    mocks.findIcd10ByCode.mockReturnValue({ code: 'J45.0' });
    mocks.findMedicalRecordById.mockResolvedValue(record);
    mocks.findActivePrescriptionForRecord.mockResolvedValue(null);
    mocks.diagnoseRecord.mockResolvedValue({
      ...record,
      id: 'record-1',
      icd10: 'J45.0',
      icdCodingSystem: 'TT06_2026',
      diagnosisText: 'Hen phế quản',
      diagnosedAt: new Date(),
      diagnosisSignedAt: new Date(),
      treatmentType: 'inpatient',
      version: 5,
    });

    const result = await diagnoseMedicalRecord('record-1', 'doctor-1', input);

    expect(result.treatmentType).toBe('inpatient');
    expect(mocks.diagnoseRecord).toHaveBeenCalledOnce();
  });
});

describe('medical-record command access and concurrency guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects vital signs for a missing record and a closed record', async () => {
    mocks.findMedicalRecordById.mockResolvedValueOnce(null);
    await expect(recordVitalSigns('record-1', 'nurse-1', {} as never)).rejects.toMatchObject({
      code: 'MEDICAL_RECORD_NOT_FOUND',
    });

    mocks.findMedicalRecordById.mockResolvedValueOnce({ status: 'closed' });
    await expect(recordVitalSigns('record-1', 'nurse-1', {} as never)).rejects.toMatchObject({
      code: 'RECORD_ALREADY_CLOSED',
    });
    expect(mocks.createVitalSignLogAndSnapshot).not.toHaveBeenCalled();
  });

  it('writes standalone vital signs through the canonical log-and-snapshot command', async () => {
    const measuredAt = new Date('2026-08-04T10:00:00.000Z');
    const input = { pulse: 72, bloodPressureSystolic: 120, bloodPressureDiastolic: 80, spo2: 98 };
    mocks.findMedicalRecordById.mockResolvedValue({ status: 'open' });
    mocks.createVitalSignLogAndSnapshot.mockResolvedValue({ id: 'vital-1', measuredAt });

    await expect(recordVitalSigns('record-1', 'nurse-1', input)).resolves.toMatchObject({
      vitalSignId: 'vital-1',
      recordId: 'record-1',
      recordedBy: 'nurse-1',
      latestSnapshotUpdated: true,
    });
    expect(mocks.createVitalSignLogAndSnapshot).toHaveBeenCalledWith('record-1', 'nurse-1', input);
  });

  it.each([
    ['not assigned', { doctorId: 'doctor-2', status: 'open' }, 'FORBIDDEN_ACCESS'],
    ['closed', { doctorId: 'doctor-1', status: 'closed' }, 'RECORD_ALREADY_CLOSED'],
  ])(
    'rejects atomic doctor input when the record is %s',
    async (_caseName, currentRecord, code) => {
      mocks.findMedicalRecordById.mockResolvedValue(currentRecord);

      await expect(
        recordVitalSignsAndAssessment('record-1', 'doctor-1', {} as never),
      ).rejects.toMatchObject({ code });
      expect(mocks.saveVitalSignsAndAssessment).not.toHaveBeenCalled();
    },
  );

  it('returns VERSION_CONFLICT when the atomic vital-and-assessment transaction loses the version race', async () => {
    const input = { expectedVersion: 4 };
    mocks.findMedicalRecordById.mockResolvedValue({ doctorId: 'doctor-1', status: 'open' });
    mocks.saveVitalSignsAndAssessment.mockResolvedValue(null);

    await expect(
      recordVitalSignsAndAssessment('record-1', 'doctor-1', input as never),
    ).rejects.toMatchObject({
      code: 'VERSION_CONFLICT',
    });
  });

  it('uses one repository command for a successful atomic vital-and-assessment save', async () => {
    const input = {
      expectedVersion: 4,
      pulse: 72,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      spo2: 98,
    };
    const measuredAt = new Date('2026-08-04T10:00:00.000Z');
    mocks.findMedicalRecordById.mockResolvedValue({ doctorId: 'doctor-1', status: 'open' });
    mocks.saveVitalSignsAndAssessment.mockResolvedValue({ log: { id: 'vital-1', measuredAt } });

    await expect(
      recordVitalSignsAndAssessment('record-1', 'doctor-1', input as never),
    ).resolves.toMatchObject({
      vitalSignId: 'vital-1',
      recordedBy: 'doctor-1',
      latestSnapshotUpdated: true,
    });
    expect(mocks.saveVitalSignsAndAssessment).toHaveBeenCalledWith(
      'record-1',
      'doctor-1',
      input,
      input,
    );
  });

  it('rejects lab orders when a selected catalog item is inactive', async () => {
    mocks.findMedicalRecordById.mockResolvedValue({ doctorId: 'doctor-1', status: 'open' });
    mocks.findActiveLabTestType.mockResolvedValue(null);

    await expect(
      orderLabTests('record-1', 'doctor-1', {
        expectedRecordVersion: 1,
        items: [{ labTestTypeId: 'lab-inactive' }],
      }),
    ).rejects.toMatchObject({ code: 'LAB_TEST_TYPE_INACTIVE' });
    expect(mocks.createLabTestOrders).not.toHaveBeenCalled();
  });

  it('maps successful lab orders and reports optimistic-lock conflicts', async () => {
    mocks.findMedicalRecordById.mockResolvedValue({ doctorId: 'doctor-1', status: 'open' });
    mocks.findActiveLabTestType.mockResolvedValue({
      name: 'Công thức máu',
      price: { toString: () => '100000' },
    });
    mocks.createLabTestOrders.mockResolvedValueOnce({
      record: { status: 'waiting_results', version: 2 },
      createdTests: [
        {
          id: 'lab-order-1',
          testName: 'Công thức máu',
          fee: { toString: () => '100000' },
          status: 'ordered',
          isUrgent: false,
        },
      ],
    });

    await expect(
      orderLabTests('record-1', 'doctor-1', {
        expectedRecordVersion: 1,
        items: [{ labTestTypeId: 'lab-1' }],
      }),
    ).resolves.toMatchObject({ recordStatus: 'waiting_results', recordVersion: 2 });

    mocks.createLabTestOrders.mockResolvedValueOnce(null);
    await expect(
      orderLabTests('record-1', 'doctor-1', {
        expectedRecordVersion: 1,
        items: [{ labTestTypeId: 'lab-1' }],
      }),
    ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
  });

  it.each([
    ['invalid ICD', null, { doctorId: 'doctor-1', status: 'open' }, 'INVALID_ICD_CODE'],
    ['forbidden', { code: 'J45.0' }, { doctorId: 'doctor-2', status: 'open' }, 'FORBIDDEN_ACCESS'],
    [
      'closed',
      { code: 'J45.0' },
      { doctorId: 'doctor-1', status: 'closed' },
      'RECORD_ALREADY_CLOSED',
    ],
  ])(
    'rejects diagnosis when the input/record is %s',
    async (_caseName, icd, currentRecord, code) => {
      mocks.findIcd10ByCode.mockReturnValue(icd);
      mocks.findMedicalRecordById.mockResolvedValue(currentRecord);

      await expect(diagnoseMedicalRecord('record-1', 'doctor-1', input)).rejects.toMatchObject({
        code,
      });
      expect(mocks.diagnoseRecord).not.toHaveBeenCalled();
    },
  );

  it('reports a diagnosis version conflict and does not write an audit log', async () => {
    mocks.findIcd10ByCode.mockReturnValue({ code: 'J45.0' });
    mocks.findMedicalRecordById.mockResolvedValue({ doctorId: 'doctor-1', status: 'open' });
    mocks.diagnoseRecord.mockResolvedValue(null);

    await expect(diagnoseMedicalRecord('record-1', 'doctor-1', input)).rejects.toMatchObject({
      code: 'VERSION_CONFLICT',
    });
    expect(mocks.recordAuditLog).not.toHaveBeenCalled();
  });
});
