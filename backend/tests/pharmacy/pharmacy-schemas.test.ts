import { describe, expect, it } from 'vitest';

import {
  inventorySummaryQuerySchema,
  listInventoryQuerySchema,
  listStockMovementsQuerySchema,
} from '../../src/modules/pharmacy/schemas/pharmacy.schemas';

describe('pharmacy API query schemas', () => {
  it('accepts inventory boundary values and normalizes the keyword', () => {
    const warehouseId = '11111111-1111-4111-8111-111111111111';
    const parsed = listInventoryQuerySchema.parse({
      keyword: ` ${'a'.repeat(100)} `,
      warehouseId,
    });

    expect(parsed.keyword).toBe('a'.repeat(100));
    expect(parsed.warehouseId).toBe(warehouseId);
    expect(inventorySummaryQuerySchema.parse({ warehouseId })).toEqual({ warehouseId });
  });

  it('rejects unsafe inventory keywords, warehouse ids and pagination', () => {
    expect(() => listInventoryQuerySchema.parse({ keyword: 'a'.repeat(101) })).toThrow();
    expect(() => listInventoryQuerySchema.parse({ warehouseId: 'warehouse-1' })).toThrow();
    expect(() => inventorySummaryQuerySchema.parse({ warehouseId: 'warehouse-1' })).toThrow();
    expect(() => listInventoryQuerySchema.parse({ page: '0' })).toThrow();
    expect(() => listInventoryQuerySchema.parse({ pageSize: '101' })).toThrow();
  });

  it('accepts valid stock movement filters and an equal date range', () => {
    const medicineId = '22222222-2222-4222-8222-222222222222';
    const warehouseId = '33333333-3333-4333-8333-333333333333';
    const parsed = listStockMovementsQuerySchema.parse({
      from: '2026-08-01',
      medicineId,
      movementType: 'adjustment',
      page: '2',
      pageSize: '50',
      to: '2026-08-01',
      warehouseId,
    });

    expect(parsed).toMatchObject({
      from: new Date('2026-08-01'),
      medicineId,
      movementType: 'adjustment',
      page: 2,
      pageSize: 50,
      to: new Date('2026-08-01'),
      warehouseId,
    });
  });

  it('rejects invalid stock movement identifiers, types, dates and order', () => {
    expect(() => listStockMovementsQuerySchema.parse({ medicineId: 'medicine-1' })).toThrow();
    expect(() => listStockMovementsQuerySchema.parse({ warehouseId: 'warehouse-1' })).toThrow();
    expect(() => listStockMovementsQuerySchema.parse({ movementType: 'unknown' })).toThrow();
    expect(() => listStockMovementsQuerySchema.parse({ from: 'not-a-date' })).toThrow();
    expect(() => listStockMovementsQuerySchema.parse({
      from: '2026-08-10',
      to: '2026-08-01',
    })).toThrow();
  });
});
