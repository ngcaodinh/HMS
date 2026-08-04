import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  invoiceFindFirst: vi.fn(),
  medicalRecordUpdateMany: vi.fn(),
  prescriptionFindFirst: vi.fn(),
  prescriptionFindUnique: vi.fn(),
  prescriptionFindUniqueOrThrow: vi.fn(),
  prescriptionUpdateMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../../src/core/db/prisma-client', () => ({
  prisma: {
    $transaction: mocks.transaction,
    prescription: {
      findUniqueOrThrow: mocks.prescriptionFindUniqueOrThrow,
      updateMany: mocks.prescriptionUpdateMany,
    },
  },
}));

import {
  cancelPrescriptionTx,
  createDraftPrescription,
  dispensePrescriptionTx,
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
          findUnique: mocks.prescriptionFindUnique,
          findUniqueOrThrow: mocks.prescriptionFindUniqueOrThrow,
          updateMany: mocks.prescriptionUpdateMany,
        },
        prescriptionItem: { create: vi.fn() },
        invoice: { findFirst: mocks.invoiceFindFirst },
        stockMovement: { findMany: vi.fn(), create: vi.fn() },
        medicineBatch: { update: vi.fn(), findUniqueOrThrow: vi.fn() },
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

  it('blocks cancellation when an active invoice already exists', async () => {
    mocks.prescriptionFindFirst.mockResolvedValue({ recordId: 'record-1', dispensedAt: null });
    mocks.invoiceFindFirst.mockResolvedValue({ id: 'invoice-1', status: 'pending' });

    await expect(cancelPrescriptionTx('prescription-1', 1, 'pharmacist-1', 'Lý do hợp lệ dài')).rejects
      .toMatchObject({ code: 'INVOICE_GENERATED' });
  });

  it('blocks dispensing when the related invoice is not paid', async () => {
    mocks.prescriptionFindUnique.mockResolvedValue({ recordId: 'record-1' });
    mocks.invoiceFindFirst.mockResolvedValue(null);

    await expect(dispensePrescriptionTx('prescription-1', 1, 'pharmacist-1')).rejects
      .toMatchObject({ code: 'INVOICE_NOT_PAID' });
    expect(mocks.prescriptionUpdateMany).not.toHaveBeenCalled();
  });
});
