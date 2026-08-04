import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findDispensablePrescriptions: vi.fn(),
}));

vi.mock('../../src/config/unifiedConfig', () => ({ config: {} }));
vi.mock('../../src/modules/audit/services/audit.service', () => ({ recordAuditLog: vi.fn() }));
vi.mock('../../src/modules/prescriptions/repositories/prescription.repository', () => ({
  cancelPrescriptionTx: vi.fn(),
  createDraftPrescription: vi.fn(),
  dispensePrescriptionTx: vi.fn(),
  findActiveMedicinesByIds: vi.fn(),
  findDispensablePrescriptions: mocks.findDispensablePrescriptions,
  findIdempotencyResult: vi.fn(),
  findLatestPrescriptionForRecord: vi.fn(),
  findNextRoundNumber: vi.fn(),
  findPrescriptionById: vi.fn(),
  findRecordForPrescription: vi.fn(),
  markXmlExportedTx: vi.fn(),
  saveIdempotencyResult: vi.fn(),
  signPrescriptionTx: vi.fn(),
}));
vi.mock('../../src/modules/prescriptions/services/allergy-matcher', () => ({
  findAllergyConflict: vi.fn(),
}));
vi.mock('../../src/modules/medical-records/repositories/medical-record.repository', () => ({
  findActivePrescriptionForRecord: vi.fn(),
}));

import { listDispensablePrescriptions } from '../../src/modules/prescriptions/services/prescription.service';

function createDispensablePrescription(invoice: { id: string; status: 'pending' | 'paid' } | null) {
  return {
    id: 'prescription-1',
    prescriptionCode: 'RX-2026-0001',
    status: 'active',
    signedAt: new Date('2026-08-04T08:00:00.000Z'),
    dispensedAt: null,
    dispensedBy: null,
    allergyOverrideReason: null,
    allergyOverrideAt: null,
    xmlExportedAt: null,
    version: 1,
    stockMovements: [],
    prescriptionItems: [],
    medicalRecord: {
      patient: {
        id: 'patient-1',
        patientCode: 'BN-0001',
        fullName: 'Patient One',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        allergies: null,
        healthInsuranceCode: null,
      },
      department: { name: 'Pharmacy' },
      doctor: { fullName: 'Doctor One' },
      icd10: 'J00',
      diagnosisText: 'Common cold',
      invoices: invoice ? [invoice] : [],
    },
  };
}

describe('dispensable prescription invoice response', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    [{ id: 'invoice-pending', status: 'pending' as const }, 'pending' as const],
    [{ id: 'invoice-paid', status: 'paid' as const }, 'paid' as const],
  ])('returns the actual %s invoice status and id', async (invoice, status) => {
    mocks.findDispensablePrescriptions.mockResolvedValue([[createDispensablePrescription(invoice)], 1]);

    await expect(listDispensablePrescriptions({ page: 1, pageSize: 20 })).resolves.toMatchObject({
      data: [{ invoice: { invoiceId: invoice.id, status } }],
      pagination: { page: 1, pageSize: 20, totalItems: 1 },
    });
  });

  it('returns null invoice when the medical record has no active invoice', async () => {
    mocks.findDispensablePrescriptions.mockResolvedValue([[createDispensablePrescription(null)], 1]);

    await expect(listDispensablePrescriptions({ page: 1, pageSize: 20 })).resolves.toMatchObject({
      data: [{ invoice: null }],
    });
  });
});
