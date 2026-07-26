import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet, apiGetPaginated } from '@/shared/api-client';
import {
  pharmacyInventoryBatchSchema,
  pharmacyInventorySummarySchema,
  pharmacyStockMovementSchema,
  warehouseSummarySchema,
  type PharmacyInventoryBatch,
  type PharmacyInventorySummary,
  type PharmacyStockMovement,
  type PharmacyWarehouse,
  type StockMovementType,
} from '../types/pharmacy-inventory.schema';

const inventoryKeys = {
  all: ['pharmacy', 'inventory'] as const,
  list: (filters: InventoryFilters) => [...inventoryKeys.all, 'list', filters] as const,
  summary: (warehouseId?: string) => [...inventoryKeys.all, 'summary', warehouseId ?? 'all'] as const,
  warehouses: () => [...inventoryKeys.all, 'warehouses'] as const,
};

const stockMovementKeys = {
  all: ['pharmacy', 'stock-movements'] as const,
  list: (filters: StockMovementFilters) => [...stockMovementKeys.all, 'list', filters] as const,
};

interface InventoryFilters {
  keyword?: string;
  page?: number;
  pageSize?: number;
  warehouseId?: string;
}

interface StockMovementFilters {
  from?: string;
  medicineId?: string;
  movementType?: StockMovementType;
  page?: number;
  pageSize?: number;
  to?: string;
  warehouseId?: string;
}

/**
 * Parse response phân trang ở biên API để UI chỉ nhận dữ liệu pharmacy đã tin cậy.
 */
function parsePaginated<T>(items: unknown[], itemSchema: z.ZodType<T>) {
  return items.map((item) => itemSchema.parse(item));
}

export function usePharmacyInventory(filters: InventoryFilters) {
  return useQuery({
    queryKey: inventoryKeys.list(filters),
    queryFn: async () => {
      const response = await apiGetPaginated<unknown>('/pharmacy/inventory', {
        params: {
          keyword: filters.keyword || undefined,
          page: filters.page ?? 1,
          pageSize: filters.pageSize ?? 20,
          warehouseId: filters.warehouseId || undefined,
        },
      });
      return {
        ...response,
        data: parsePaginated<PharmacyInventoryBatch>(response.data, pharmacyInventoryBatchSchema),
      };
    },
  });
}

export function usePharmacyInventorySummary(warehouseId?: string) {
  return useQuery({
    queryKey: inventoryKeys.summary(warehouseId),
    queryFn: async (): Promise<PharmacyInventorySummary> => {
      const response = await apiGet<unknown>('/pharmacy/inventory/summary', {
        params: { warehouseId: warehouseId || undefined },
      });
      return pharmacyInventorySummarySchema.parse(response);
    },
  });
}

export function usePharmacyWarehouses() {
  return useQuery({
    queryKey: inventoryKeys.warehouses(),
    queryFn: async (): Promise<PharmacyWarehouse[]> => {
      const response = await apiGet<unknown[]>('/pharmacy/warehouses');
      return response.map((warehouse) => warehouseSummarySchema.parse(warehouse));
    },
  });
}

export function usePharmacyStockMovements(filters: StockMovementFilters) {
  return useQuery({
    queryKey: stockMovementKeys.list(filters),
    queryFn: async () => {
      const response = await apiGetPaginated<unknown>('/pharmacy/stock-movements', {
        params: {
          from: filters.from,
          medicineId: filters.medicineId || undefined,
          movementType: filters.movementType,
          page: filters.page ?? 1,
          pageSize: filters.pageSize ?? 20,
          to: filters.to,
          warehouseId: filters.warehouseId || undefined,
        },
      });
      return {
        ...response,
        data: parsePaginated<PharmacyStockMovement>(response.data, pharmacyStockMovementSchema),
      };
    },
  });
}
