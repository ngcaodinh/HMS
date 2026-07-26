import { describe, expect, it } from 'vitest';

import { AppError } from '../../src/core/errors/app-error';
import { allocateFefoBatches } from '../../src/modules/prescriptions/domain/fefo-allocation';

describe('allocateFefoBatches', () => {
  const today = new Date('2026-07-26T00:00:00.000Z');

  it('allocates the earliest non-expired batches first across multiple batches', () => {
    const allocations = allocateFefoBatches({
      items: [{ prescriptionItemId: 'item-1', medicineId: 'med-1', quantity: 8 }],
      batches: [
        {
          batchId: 'batch-late',
          batchNumber: 'LATE-01',
          expiryDate: new Date('2026-12-31T00:00:00.000Z'),
          medicineId: 'med-1',
          quantity: 10,
        },
        {
          batchId: 'batch-early',
          batchNumber: 'EARLY-01',
          expiryDate: new Date('2026-08-31T00:00:00.000Z'),
          medicineId: 'med-1',
          quantity: 5,
        },
      ],
      today,
    });

    expect(allocations).toEqual([
      {
        batchId: 'batch-early',
        batchNumber: 'EARLY-01',
        expiryDate: new Date('2026-08-31T00:00:00.000Z'),
        medicineId: 'med-1',
        prescriptionItemId: 'item-1',
        quantity: 5,
      },
      {
        batchId: 'batch-late',
        batchNumber: 'LATE-01',
        expiryDate: new Date('2026-12-31T00:00:00.000Z'),
        medicineId: 'med-1',
        prescriptionItemId: 'item-1',
        quantity: 3,
      },
    ]);
  });

  it('skips expired batches when checking availability', () => {
    expect(() =>
      allocateFefoBatches({
        items: [{ prescriptionItemId: 'item-1', medicineId: 'med-1', quantity: 1 }],
        batches: [
          {
            batchId: 'batch-expired',
            batchNumber: 'OLD-01',
            expiryDate: new Date('2026-07-25T00:00:00.000Z'),
            medicineId: 'med-1',
            quantity: 99,
          },
        ],
        today,
      }),
    ).toThrow(AppError);
  });

  it('throws INSUFFICIENT_STOCK when eligible quantity cannot cover the prescription item', () => {
    try {
      allocateFefoBatches({
        items: [{ prescriptionItemId: 'item-1', medicineId: 'med-1', quantity: 6 }],
        batches: [
          {
            batchId: 'batch-early',
            batchNumber: 'EARLY-01',
            expiryDate: new Date('2026-08-31T00:00:00.000Z'),
            medicineId: 'med-1',
            quantity: 5,
          },
        ],
        today,
      });
      throw new Error('Expected allocation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('INSUFFICIENT_STOCK');
      expect((error as AppError).httpStatus).toBe(409);
    }
  });
});
