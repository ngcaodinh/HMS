import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findRecordForPrescription: vi.fn(),
  findLatestPrescriptionForRecord: vi.fn(),
  findActivePrescriptionForRecord: vi.fn(),
}));

vi.mock('../../src/config/unifiedConfig', () => ({ config: {} }));
vi.mock('../../src/modules/prescriptions/repositories/prescription.repository', () => ({
  findRecordForPrescription: mocks.findRecordForPrescription,
  findLatestPrescriptionForRecord: mocks.findLatestPrescriptionForRecord,
  cancelPrescriptionTx: vi.fn(),
  createDraftPrescription: vi.fn(),
  dispensePrescriptionTx: vi.fn(),
  findActiveMedicinesByIds: vi.fn(),
  findDispensablePrescriptions: vi.fn(),
  findIdempotencyResult: vi.fn(),
  findNextRoundNumber: vi.fn(),
  findPrescriptionById: vi.fn(),
  markXmlExportedTx: vi.fn(),
  saveIdempotencyResult: vi.fn(),
  signPrescriptionTx: vi.fn(),
}));
vi.mock('../../src/modules/medical-records/repositories/medical-record.repository', () => ({
  findActivePrescriptionForRecord: mocks.findActivePrescriptionForRecord,
}));
vi.mock('../../src/modules/audit/services/audit.service', () => ({ recordAuditLog: vi.fn() }));

import { getLatestPrescriptionForRecord } from '../../src/modules/prescriptions/services/prescription.service';

const closedRecord = {
  doctorId: 'doctor-1',
  status: 'closed',
  treatmentType: null,
};

const latestDraft = {
  id: 'prescription-2',
  recordId: 'record-1',
  status: 'draft',
  isSigned: false,
  signedAt: null,
  xmlExportedAt: null,
  allergyOverrideReason: null,
  version: 3,
  prescriptionItems: [
    {
      id: 'item-1',
      medicineId: 'medicine-1',
      medicineNameSnapshot: 'Fexofenadine',
      activeIngredientSnapshot: 'Fexofenadine',
      quantity: 1,
      days: 1,
      dosePerUse: '1 viên',
      usesPerDay: 1,
      useTiming: 'Sau ăn',
      dosageInstruction: '1 viên, sau ăn',
      unitPrice: { toString: () => '1000' },
      total: { toString: () => '1000' },
    },
  ],
};

describe('latest prescription query contract', () => {
  beforeEach(() => vi.clearAllMocks());

  it('allows reading the latest prescription on a closed record and reports active history separately', async () => {
    mocks.findRecordForPrescription.mockResolvedValue(closedRecord);
    mocks.findLatestPrescriptionForRecord.mockResolvedValue(latestDraft);
    mocks.findActivePrescriptionForRecord.mockResolvedValue({ id: 'prescription-1' });

    await expect(getLatestPrescriptionForRecord('record-1', 'doctor-1')).resolves.toMatchObject({
      prescription: {
        prescriptionId: 'prescription-2',
        status: 'draft',
        items: [expect.objectContaining({ medicineId: 'medicine-1', total: '1000' })],
      },
      hasActivePrescription: true,
    });
  });

  it('returns no prescription while preserving an active-prescription flag', async () => {
    mocks.findRecordForPrescription.mockResolvedValue(closedRecord);
    mocks.findLatestPrescriptionForRecord.mockResolvedValue(null);
    mocks.findActivePrescriptionForRecord.mockResolvedValue({ id: 'prescription-1' });

    await expect(getLatestPrescriptionForRecord('record-1', 'doctor-1')).resolves.toEqual({
      prescription: null,
      hasActivePrescription: true,
    });
  });

  it.each([
    [null, 'MEDICAL_RECORD_NOT_FOUND'],
    [{ ...closedRecord, doctorId: 'doctor-2' }, 'FORBIDDEN_ACCESS'],
  ])('rejects latest prescription access for invalid record access: %s', async (record, code) => {
    mocks.findRecordForPrescription.mockResolvedValue(record);

    await expect(getLatestPrescriptionForRecord('record-1', 'doctor-1')).rejects.toMatchObject({
      code,
    });
    expect(mocks.findLatestPrescriptionForRecord).not.toHaveBeenCalled();
  });
});
