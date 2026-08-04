import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  medicalRecordUpdateMany: vi.fn(),
  labTestCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../../src/core/db/prisma-client', () => ({
  prisma: {
    medicalRecord: { updateMany: mocks.medicalRecordUpdateMany },
    $transaction: mocks.transaction,
  },
}));

import {
  createLabTestOrders,
  updateClinicalAssessment,
} from '../../src/modules/medical-records/repositories/medical-record.repository';

describe('medical-record repository concurrency guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        medicalRecord: {
          updateMany: mocks.medicalRecordUpdateMany,
          findUniqueOrThrow: vi.fn(),
        },
        labTest: { create: mocks.labTestCreate },
      }),
    );
  });

  it('guards clinical assessment updates by doctor, version and open status', async () => {
    mocks.medicalRecordUpdateMany.mockResolvedValue({ count: 1 });

    await updateClinicalAssessment('record-1', 'doctor-1', 4, {
      expectedVersion: 4,
      chiefComplaint: 'Đau đầu',
    });

    expect(mocks.medicalRecordUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'record-1',
          doctorId: 'doctor-1',
          version: 4,
          deletedAt: null,
          status: { not: 'closed' },
        },
      }),
    );
  });

  it('does not create lab orders when the atomic doctor/status guard loses the race', async () => {
    mocks.medicalRecordUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      createLabTestOrders(
        'record-1',
        4,
        'doctor-1',
        [{ labTestTypeId: 'lab-1' }],
        new Map([['lab-1', { testName: 'Công thức máu', fee: '100' }]]),
      ),
    ).resolves.toBeNull();

    expect(mocks.medicalRecordUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          doctorId: 'doctor-1',
          status: { not: 'closed' },
        }),
      }),
    );
    expect(mocks.labTestCreate).not.toHaveBeenCalled();
  });
});
