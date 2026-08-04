import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  medicalRecordUpdateMany: vi.fn(),
  vitalSignLogCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../../src/core/db/prisma-client', () => ({
  prisma: { $transaction: mocks.transaction },
}));

import { createVitalSignLogAndSnapshot } from '../../src/modules/medical-records/repositories/vital-sign.repository';

const validInput = {
  pulse: 72,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  spo2: 98,
};

describe('vital-sign repository concurrency guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        medicalRecord: { updateMany: mocks.medicalRecordUpdateMany },
        vitalSignLog: { create: mocks.vitalSignLogCreate },
      }),
    );
    mocks.vitalSignLogCreate.mockResolvedValue({ id: 'vital-1' });
  });

  it('updates the snapshot only while the record is open', async () => {
    mocks.medicalRecordUpdateMany.mockResolvedValue({ count: 1 });

    await createVitalSignLogAndSnapshot('record-1', 'nurse-1', validInput);

    expect(mocks.medicalRecordUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'record-1', deletedAt: null, status: { not: 'closed' } },
      }),
    );
    expect(mocks.vitalSignLogCreate).toHaveBeenCalledOnce();
  });

  it('rejects the log when the record closes before the transaction guard', async () => {
    mocks.medicalRecordUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      createVitalSignLogAndSnapshot('record-1', 'nurse-1', validInput),
    ).rejects.toMatchObject({ code: 'RECORD_ALREADY_CLOSED' });
    expect(mocks.vitalSignLogCreate).not.toHaveBeenCalled();
  });
});
