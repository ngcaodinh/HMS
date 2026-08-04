import { describe, expect, it } from 'vitest';

import {
  inventorySummaryQuerySchema,
  listInventoryQuerySchema,
  listStockMovementsQuerySchema,
} from '../../src/modules/pharmacy/schemas/pharmacy.schemas';

describe('pharmacy API query schemas', () => {
  it('limits inventory keywords and validates warehouse UUIDs', () => {
    expect(() => listInventoryQuerySchema.parse({ keyword: 'a'.repeat(101) })).toThrow();
    expect(() => listInventoryQuerySchema.parse({ warehouseId: 'warehouse-1' })).toThrow();
    expect(() => inventorySummaryQuerySchema.parse({ warehouseId: 'warehouse-1' })).toThrow();
  });

  it('validates stock movement identifiers and date order', () => {
    expect(() => listStockMovementsQuerySchema.parse({ medicineId: 'medicine-1' })).toThrow();
    expect(() => listStockMovementsQuerySchema.parse({
      from: '2026-08-10',
      to: '2026-08-01',
    })).toThrow();
    expect(listStockMovementsQuerySchema.parse({
      from: '2026-08-01',
      to: '2026-08-10',
    })).toMatchObject({
      from: new Date('2026-08-01'),
      to: new Date('2026-08-10'),
    });
  });
});
