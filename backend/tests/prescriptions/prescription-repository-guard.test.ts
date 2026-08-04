import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  invoiceFindFirst: vi.fn(),
  medicalRecordUpdateMany: vi.fn(),
  stockMovementFindMany: vi.fn(),
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
    mocks.stockMovementFindMany.mockResolvedValue([]);
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
        stockMovement: { findMany: mocks.stockMovementFindMany, create: vi.fn() },
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

  it.each(['pending', 'paid'])('blocks cancellation when an active %s invoice exists', async (status) => {
    mocks.prescriptionFindFirst.mockResolvedValue({ recordId: 'record-1', dispensedAt: null });
    mocks.invoiceFindFirst.mockResolvedValue({ id: 'invoice-1', status });

    await expect(cancelPrescriptionTx('prescription-1', 1, 'pharmacist-1', 'Ly do hop le dai')).rejects
      .toMatchObject({ code: 'INVOICE_GENERATED' });
    expect(mocks.prescriptionUpdateMany).not.toHaveBeenCalled();
  });

  it('returns null for a stale cancellation version before checking invoices', async () => {
    mocks.prescriptionFindFirst.mockResolvedValue(null);

    await expect(cancelPrescriptionTx('prescription-1', 1, 'pharmacist-1', 'Ly do hop le dai'))
      .resolves.toBeNull();
    expect(mocks.invoiceFindFirst).not.toHaveBeenCalled();
  });

  it('blocks cancellation after dispensing before checking invoices', async () => {
    mocks.prescriptionFindFirst.mockResolvedValue({ recordId: 'record-1', dispensedAt: new Date() });

    await expect(cancelPrescriptionTx('prescription-1', 1, 'pharmacist-1', 'Ly do hop le dai')).rejects
      .toMatchObject({ code: 'PRESCRIPTION_ALREADY_DISPENSED' });
    expect(mocks.invoiceFindFirst).not.toHaveBeenCalled();
  });

  it('cancels without an active invoice and returns the updated prescription', async () => {
    const updatedPrescription = { id: 'prescription-1', status: 'cancelled', version: 2 };
    mocks.prescriptionFindFirst.mockResolvedValue({ recordId: 'record-1', dispensedAt: null });
    mocks.invoiceFindFirst.mockResolvedValue(null);
    mocks.prescriptionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.prescriptionFindUniqueOrThrow.mockResolvedValue(updatedPrescription);

    await expect(cancelPrescriptionTx('prescription-1', 1, 'pharmacist-1', 'Ly do hop le dai'))
      .resolves.toEqual(updatedPrescription);
  });

  it('blocks dispensing when no related invoice exists', async () => {
    mocks.prescriptionFindUnique.mockResolvedValue({ recordId: 'record-1' });
    mocks.invoiceFindFirst.mockResolvedValue(null);

    await expect(dispensePrescriptionTx('prescription-1', 1, 'pharmacist-1')).rejects
      .toMatchObject({ code: 'INVOICE_NOT_PAID' });
    expect(mocks.prescriptionUpdateMany).not.toHaveBeenCalled();
  });

  it('blocks dispensing when the related invoice is pending', async () => {
    mocks.prescriptionFindUnique.mockResolvedValue({ recordId: 'record-1' });
    mocks.invoiceFindFirst.mockImplementation((query: { where?: { status?: string } }) =>
      query.where?.status === 'paid' ? null : { id: 'invoice-1', status: 'pending' });

    await expect(dispensePrescriptionTx('prescription-1', 1, 'pharmacist-1')).rejects
      .toMatchObject({ code: 'INVOICE_NOT_PAID' });
    expect(mocks.prescriptionUpdateMany).not.toHaveBeenCalled();
  });

  it('returns null when dispensing targets a missing prescription', async () => {
    mocks.prescriptionFindUnique.mockResolvedValue(null);

    await expect(dispensePrescriptionTx('prescription-1', 1, 'pharmacist-1')).resolves.toBeNull();
    expect(mocks.invoiceFindFirst).not.toHaveBeenCalled();
  });

  it('dispenses with a paid invoice and returns the updated prescription', async () => {
    const updatedPrescription = { id: 'prescription-1', status: 'active', version: 2 };
    mocks.prescriptionFindUnique.mockResolvedValue({ recordId: 'record-1' });
    mocks.invoiceFindFirst.mockResolvedValue({ id: 'invoice-1', status: 'paid' });
    mocks.prescriptionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.prescriptionFindUniqueOrThrow.mockResolvedValue(updatedPrescription);

    await expect(dispensePrescriptionTx('prescription-1', 1, 'pharmacist-1'))
      .resolves.toEqual(updatedPrescription);
    expect(mocks.prescriptionUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'prescription-1',
        version: 1,
        dispensedAt: null,
      }),
    }));
  });

  it('returns null when paid dispensing loses the optimistic version race', async () => {
    mocks.prescriptionFindUnique.mockResolvedValue({ recordId: 'record-1' });
    mocks.invoiceFindFirst.mockResolvedValue({ id: 'invoice-1', status: 'paid' });
    mocks.prescriptionUpdateMany.mockResolvedValue({ count: 0 });

    await expect(dispensePrescriptionTx('prescription-1', 1, 'pharmacist-1')).resolves.toBeNull();
    expect(mocks.prescriptionFindUniqueOrThrow).not.toHaveBeenCalled();
  });
});
