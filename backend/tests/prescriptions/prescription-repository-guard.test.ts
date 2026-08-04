import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  medicalRecordUpdateMany: vi.fn(),
  prescriptionFindFirst: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../../src/core/db/prisma-client', () => ({
  prisma: { $transaction: mocks.transaction },
}));

import {
  createDraftPrescription,
  signPrescriptionTx,
} from '../../src/modules/prescriptions/repositories/prescription.repository';

describe('prescription repository concurrency guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        medicalRecord: { updateMany: mocks.medicalRecordUpdateMany },
        prescription: {
          count: vi.fn(),
          create: vi.fn(),
          findFirst: mocks.prescriptionFindFirst,
        },
        prescriptionItem: { create: vi.fn() },
      }),
    );
  });

  it('requires the assigned doctor when creating a prescription draft', async () => {
    mocks.medicalRecordUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      createDraftPrescription('record-1', 'doctor-1', 1, 'N', 4, [], undefined),
    ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
    expect(mocks.medicalRecordUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ doctorId: 'doctor-1', version: 4 }),
      }),
    );
  });

  it('requires the assigned doctor and outpatient status before signing', async () => {
    mocks.prescriptionFindFirst.mockResolvedValue({
      recordId: 'record-1',
      prescriptionItems: [],
    });
    mocks.medicalRecordUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      signPrescriptionTx('prescription-1', 1, 'doctor-1', undefined),
    ).rejects.toMatchObject({ code: 'RECORD_NOT_OUTPATIENT' });
    expect(mocks.medicalRecordUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ doctorId: 'doctor-1', status: 'diagnosed' }),
      }),
    );
  });
});
