import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cancelPrescriptionTx: vi.fn(),
  createDraftPrescription: vi.fn(),
  dispensePrescriptionTx: vi.fn(),
  findActiveMedicinesByIds: vi.fn(),
  findDispensablePrescriptions: vi.fn(),
  findIdempotencyResult: vi.fn(),
  findLatestPrescriptionForRecord: vi.fn(),
  findNextRoundNumber: vi.fn(),
  findPrescriptionById: vi.fn(),
  findRecordForPrescription: vi.fn(),
  markXmlExportedTx: vi.fn(),
  saveIdempotencyResult: vi.fn(),
  signPrescriptionTx: vi.fn(),
  recordAuditLog: vi.fn(),
  findAllergyConflict: vi.fn(),
}));

vi.mock('../../src/config/unifiedConfig', () => ({ config: {} }));
vi.mock('../../src/modules/audit/services/audit.service', () => ({
  recordAuditLog: mocks.recordAuditLog,
}));
vi.mock('../../src/modules/prescriptions/repositories/prescription.repository', () => ({
  cancelPrescriptionTx: mocks.cancelPrescriptionTx,
  createDraftPrescription: mocks.createDraftPrescription,
  dispensePrescriptionTx: mocks.dispensePrescriptionTx,
  findActiveMedicinesByIds: mocks.findActiveMedicinesByIds,
  findDispensablePrescriptions: mocks.findDispensablePrescriptions,
  findIdempotencyResult: mocks.findIdempotencyResult,
  findLatestPrescriptionForRecord: mocks.findLatestPrescriptionForRecord,
  findNextRoundNumber: mocks.findNextRoundNumber,
  findPrescriptionById: mocks.findPrescriptionById,
  findRecordForPrescription: mocks.findRecordForPrescription,
  markXmlExportedTx: mocks.markXmlExportedTx,
  saveIdempotencyResult: mocks.saveIdempotencyResult,
  signPrescriptionTx: mocks.signPrescriptionTx,
}));
vi.mock('../../src/modules/prescriptions/services/allergy-matcher', () => ({
  findAllergyConflict: mocks.findAllergyConflict,
}));

import { createPrescriptionDraft } from '../../src/modules/prescriptions/services/prescription.service';

const outpatientRecord = {
  id: 'record-1',
  doctorId: 'doctor-1',
  status: 'diagnosed',
  treatmentType: 'outpatient',
  version: 4,
  icd10: 'J45.0',
  patient: { allergies: null },
};

const validPrescriptionItem = {
  medicineId: 'medicine-1',
  quantity: 1,
  days: 1,
  dosePerUse: '1 viên',
  useTiming: 'Sau ăn',
  dosageInstruction: '1 viên, sau ăn',
};

const validInput = {
  expectedRecordVersion: 4,
  items: [validPrescriptionItem],
};

const medicine = {
  id: 'medicine-1',
  name: 'Fexofenadine',
  activeIngredient: 'Fexofenadine',
  dosage: '120mg',
  unitPrice: {
    toString: () => '1000',
    mul: () => ({ toString: () => '1000' }),
  },
};

function configureSuccessfulDraft() {
  mocks.findRecordForPrescription.mockResolvedValue(outpatientRecord);
  mocks.findNextRoundNumber.mockResolvedValue(1);
  mocks.findActiveMedicinesByIds.mockResolvedValue([medicine]);
  mocks.createDraftPrescription.mockResolvedValue({
    prescription: {
      id: 'prescription-1',
      recordId: 'record-1',
      status: 'draft',
      isSigned: false,
      version: 1,
    },
    items: [
      {
        id: 'item-1',
        medicineId: 'medicine-1',
        medicineNameSnapshot: 'Fexofenadine',
        activeIngredientSnapshot: 'Fexofenadine',
        quantity: 1,
        days: 1,
        dosageInstruction: '1 viên, sau ăn',
        unitPrice: { toString: () => '1000' },
        total: { toString: () => '1000' },
      },
    ],
  });
}

describe('prescription business validation matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findAllergyConflict.mockReturnValue(null);
  });

  it.each([
    [
      'open record with outpatient default',
      { ...outpatientRecord, status: 'open' },
      'RECORD_NOT_OUTPATIENT',
    ],
    [
      'diagnosed inpatient record',
      { ...outpatientRecord, treatmentType: 'inpatient' },
      'RECORD_NOT_OUTPATIENT',
    ],
    ['closed record', { ...outpatientRecord, status: 'closed' }, 'RECORD_ALREADY_CLOSED'],
    [
      'record owned by another doctor',
      { ...outpatientRecord, doctorId: 'doctor-2' },
      'FORBIDDEN_ACCESS',
    ],
  ])('rejects prescription creation for %s', async (_caseName, record, code) => {
    mocks.findRecordForPrescription.mockResolvedValue(record);

    await expect(createPrescriptionDraft('record-1', 'doctor-1', validInput)).rejects.toMatchObject(
      { code },
    );
    expect(mocks.createDraftPrescription).not.toHaveBeenCalled();
  });

  it('rejects stale record versions before resolving medicines', async () => {
    mocks.findRecordForPrescription.mockResolvedValue(outpatientRecord);

    await expect(
      createPrescriptionDraft('record-1', 'doctor-1', { ...validInput, expectedRecordVersion: 3 }),
    ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
    expect(mocks.findActiveMedicinesByIds).not.toHaveBeenCalled();
  });

  it('requires explicit confirmation for a no-drug prescription', async () => {
    mocks.findRecordForPrescription.mockResolvedValue(outpatientRecord);

    await expect(
      createPrescriptionDraft('record-1', 'doctor-1', {
        expectedRecordVersion: 4,
        items: [],
      }),
    ).rejects.toMatchObject({ code: 'INVALID_PRESCRIPTION' });

    configureSuccessfulDraft();
    await expect(
      createPrescriptionDraft('record-1', 'doctor-1', {
        expectedRecordVersion: 4,
        items: [],
        noDrugConfirmation: true,
      }),
    ).resolves.toMatchObject({ prescriptionId: 'prescription-1' });
    expect(mocks.findActiveMedicinesByIds).not.toHaveBeenCalled();
  });

  it('rejects medicine ids that are missing or inactive in the server catalog', async () => {
    mocks.findRecordForPrescription.mockResolvedValue(outpatientRecord);
    mocks.findActiveMedicinesByIds.mockResolvedValue([]);

    await expect(createPrescriptionDraft('record-1', 'doctor-1', validInput)).rejects.toMatchObject(
      {
        code: 'INVALID_PRESCRIPTION',
      },
    );
    expect(mocks.createDraftPrescription).not.toHaveBeenCalled();
  });

  it.each([
    ['over 90 days', { days: 91 }, 'DURATION_EXCEEDED'],
    ['over 30 days without a reason', { days: 31 }, 'DURATION_EXCEEDED'],
    ['over 30 days with a short reason', { days: 31, longTermReason: 'ngắn' }, 'DURATION_EXCEEDED'],
  ])('rejects prescription duration %s', async (_caseName, override, code) => {
    configureSuccessfulDraft();
    await expect(
      createPrescriptionDraft('record-1', 'doctor-1', {
        ...validInput,
        items: [{ ...validPrescriptionItem, ...override }],
      }),
    ).rejects.toMatchObject({ code });
    expect(mocks.createDraftPrescription).not.toHaveBeenCalled();
  });

  it('rejects over-30-day therapy when the diagnosis is not in the chronic catalog', async () => {
    configureSuccessfulDraft();
    mocks.findRecordForPrescription.mockResolvedValue({ ...outpatientRecord, icd10: 'L50.0' });

    await expect(
      createPrescriptionDraft('record-1', 'doctor-1', {
        ...validInput,
        items: [{ ...validPrescriptionItem, days: 31 }],
        longTermReason: 'Lý do chuyên môn đủ dài cho điều trị',
      }),
    ).rejects.toMatchObject({ code: 'DURATION_EXCEEDED' });
    expect(mocks.createDraftPrescription).not.toHaveBeenCalled();
  });

  it('allows over-30-day therapy only for catalogued chronic disease with a sufficient reason', async () => {
    configureSuccessfulDraft();

    await expect(
      createPrescriptionDraft('record-1', 'doctor-1', {
        ...validInput,
        items: [{ ...validPrescriptionItem, days: 31 }],
        longTermReason: 'Điều trị duy trì bệnh hen mạn tính',
      }),
    ).resolves.toMatchObject({ prescriptionId: 'prescription-1' });
  });

  it('requires a sufficiently detailed allergy override reason', async () => {
    configureSuccessfulDraft();
    mocks.findAllergyConflict.mockReturnValue('Penicillin');

    await expect(createPrescriptionDraft('record-1', 'doctor-1', validInput)).rejects.toMatchObject(
      { code: 'ALLERGY_WARNING' },
    );
    await expect(
      createPrescriptionDraft('record-1', 'doctor-1', {
        ...validInput,
        allergyOverrideReason: 'ngắn',
      }),
    ).rejects.toMatchObject({ code: 'ALLERGY_WARNING' });
    await expect(
      createPrescriptionDraft('record-1', 'doctor-1', {
        ...validInput,
        allergyOverrideReason: 'Cần dùng theo đánh giá chuyên môn',
      }),
    ).resolves.toMatchObject({ prescriptionId: 'prescription-1' });
  });

  it('returns immutable medicine snapshots and records the create audit event', async () => {
    configureSuccessfulDraft();

    await expect(
      createPrescriptionDraft('record-1', 'doctor-1', validInput),
    ).resolves.toMatchObject({
      prescriptionId: 'prescription-1',
      items: [
        expect.objectContaining({
          medicineId: 'medicine-1',
          medicineNameSnapshot: 'Fexofenadine',
          total: '1000',
        }),
      ],
    });
    expect(mocks.createDraftPrescription).toHaveBeenCalledOnce();
    expect(mocks.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        resource: 'Prescription',
        resourceId: 'prescription-1',
      }),
    );
  });
});
