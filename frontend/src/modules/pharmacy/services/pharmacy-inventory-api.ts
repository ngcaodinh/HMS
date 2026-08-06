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

/**
 * Query adapter read-only cho tồn kho và stock movement.
 * Các hook gọi API có permission pharmacy tương ứng, parse response bằng Zod và chỉ cập nhật cache
 * React Query; client không tạo movement, thay đổi batch hoặc quyết định cấp phát.
 */

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

/** Bộ lọc tồn kho; backend mặc định page = 1, pageSize = 20 và giới hạn pageSize tối đa 100. */
interface InventoryFilters {
  keyword?: string;
  page?: number;
  pageSize?: number;
  warehouseId?: string;
}

/**
 * Bộ lọc báo cáo stock movement.
 * `from`/`to` là chuỗi ngày giờ backend có thể parse và phải tạo khoảng không đảo chiều; pageSize
 * dùng mặc định 20, tối đa 100 theo validation server.
 */
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
 * Parse từng item ở biên API để UI chỉ nhận dữ liệu pharmacy khớp schema.
 * ZodError được giữ nguyên để query caller xử lý như lỗi tải dữ liệu, không tự fallback sang mock.
 *
 * @param items Danh sách item chưa tin cậy từ response phân trang.
 * @param itemSchema Schema dùng để parse và chuẩn hóa từng item.
 * @returns Danh sách item đã được kiểm tra kiểu.
 */
function parsePaginated<T>(items: unknown[], itemSchema: z.ZodType<T>) {
  return items.map((item) => itemSchema.parse(item));
}

/**
 * Lấy danh sách batch tồn kho theo keyword, trang và warehouse.
 *
 * @param filters Bộ lọc query; page/pageSize có fallback ở adapter trước khi gọi API.
 * @returns Query state gồm dữ liệu phân trang đã parse, loading, error và refetch của React Query.
 * @remarks GET `/pharmacy/inventory`, yêu cầu permission `pharmacy.inventory.read`; query key thay đổi
 * theo filter để cache tách theo kho/trang. Không có mutation tồn kho ở client.
 */
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

/**
 * Lấy KPI tồn kho server-derived cho một kho hoặc toàn bộ kho.
 *
 * @param warehouseId ID kho tùy chọn; bỏ trống để backend tổng hợp toàn bộ kho.
 * @returns Query state với summary đã parse bằng `pharmacyInventorySummarySchema`.
 * @remarks GET `/pharmacy/inventory/summary`, yêu cầu `pharmacy.inventory.read`; lỗi HTTP hoặc lỗi
 * schema được giữ trong query state, không tự tạo giá trị KPI thay thế.
 */
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

/**
 * Lấy danh sách kho đang hoạt động cho các bộ lọc pharmacy.
 *
 * @returns Query state với danh sách warehouse summary đã parse.
 * @remarks GET `/pharmacy/warehouses`, yêu cầu `pharmacy.inventory.read`; dữ liệu được cache theo một
 * key cố định và không làm thay đổi danh mục kho từ phía client.
 */
export function usePharmacyWarehouses() {
  return useQuery({
    queryKey: inventoryKeys.warehouses(),
    queryFn: async (): Promise<PharmacyWarehouse[]> => {
      const response = await apiGet<unknown[]>('/pharmacy/warehouses');
      return response.map((warehouse) => warehouseSummarySchema.parse(warehouse));
    },
  });
}

/**
 * Lấy báo cáo stock movement theo khoảng thời gian, thuốc, loại movement và kho.
 *
 * @param filters Bộ lọc query; khoảng ngày được backend kiểm tra thêm trước khi truy vấn.
 * @returns Query state với dữ liệu movement immutable đã parse và metadata phân trang.
 * @remarks GET `/pharmacy/stock-movements`, yêu cầu `pharmacy.report.read`; đây là dữ liệu read-only phục
 * vụ báo cáo/audit, không phải command điều chỉnh tồn kho. Lỗi validation/API được trả qua query state.
 */
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
