import { describe, expect, it } from 'vitest';

import { getInvalidStockMovementDateRangeError } from '../../src/modules/pharmacy/validators/stock-movement-date-range';

describe('stock movement date range guard', () => {
  it('accepts missing, invalid and equal/ascending date values for schema validation', () => {
    expect(getInvalidStockMovementDateRangeError(undefined, undefined)).toBeNull();
    expect(getInvalidStockMovementDateRangeError('not-a-date', '2026-08-01')).toBeNull();
    expect(getInvalidStockMovementDateRangeError('2026-08-01', '2026-08-01')).toBeNull();
    expect(getInvalidStockMovementDateRangeError('2026-08-01', '2026-08-02')).toBeNull();
  });

  it('returns the stable INVALID_DATE_RANGE business error for reversed dates', () => {
    const error = getInvalidStockMovementDateRangeError('2026-08-02', '2026-08-01');

    expect(error).not.toBeNull();
    expect(error).toMatchObject({
      code: 'INVALID_DATE_RANGE',
      httpStatus: 400,
      details: [{ field: 'from' }],
    });
  });
});
