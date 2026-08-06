import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGetPaginated, apiPost, httpClient } from '@/shared/api-client';
import type { DispensablePrescription } from '../types/prescription-dispense.types';

/**
 * Query và command adapter cho worklist cấp phát thuốc.
 * GET chỉ đọc dữ liệu server-derived; các POST gửi version/idempotency cần thiết để backend kiểm tra
 * chữ ký, paid gate, allergy/FEFO và quyền. Client không tự chuyển trạng thái, cấp phát hoặc trừ kho.
 * Cache invalidation dùng React Query; retry/error tuân theo cấu hình chung của QueryClient/provider.
 */

const LIST_QUERY_KEY = ['prescriptions', 'dispensable'] as const;

/** Kết quả backend sau command cấp phát; timestamp và version không do client tự tạo. */
interface DispensePrescriptionResult {
  dispensedAt: string | null;
  dispensedBy: string | null;
  prescriptionId: string;
  version: number;
}

/** Kết quả backend sau khi chuyển đơn từ `active` sang `xml_exported`. */
interface ExportPrescriptionXmlResult {
  prescriptionId: string;
  status: 'xml_exported';
  xmlExportedAt: string | null;
  version: number;
}

/**
 * Tạo khóa idempotency cho command cấp phát để retry/double-click không ghi nhận trùng.
 *
 * @returns UUID từ Web Crypto khi có, hoặc khóa fallback theo thời gian/ngẫu nhiên.
 * @remarks Khóa chỉ được gửi trong header command; backend mới là nơi lưu và quyết định kết quả.
 */
export function createIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `dispense-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Lấy worklist đơn đã ký, chưa hủy, có thể chưa hoặc đã cấp phát.
 *
 * @param filters Keyword, trạng thái đã cấp phát, phân trang và kho cần lọc.
 * @returns Query state với response phân trang từ API và trạng thái loading/error/refetch.
 * @remarks GET `/prescriptions`, query gồm `dispensed`, `keyword`, `page`, `pageSize`, `warehouseId`;
 * yêu cầu `prescription.dispense.read`. Adapter giữ envelope phân trang `data/pagination` và typed item,
 * lỗi API truyền lên query state; việc retry/cache theo cấu hình React Query.
 */
export function useDispensablePrescriptions(filters: {
  dispensed: boolean;
  keyword: string;
  page?: number;
  pageSize?: number;
  warehouseId?: string;
}) {
  return useQuery({
    queryKey: [...LIST_QUERY_KEY, filters.keyword, filters.dispensed, filters.page, filters.pageSize, filters.warehouseId],
    queryFn: () =>
      apiGetPaginated<DispensablePrescription>('/prescriptions', {
        params: {
          dispensed: filters.dispensed,
          keyword: filters.keyword || undefined,
          page: filters.page ?? 1,
          pageSize: filters.pageSize ?? 20,
          warehouseId: filters.warehouseId || undefined,
        },
      }),
  });
}

/** Invalidate worklist sau command để UI đọc lại trạng thái server mới nhất. */
function useInvalidateDispensableList() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: LIST_QUERY_KEY });
}

/**
 * Gửi command xác nhận cấp phát cho đơn đã ký.
 *
 * @returns Mutation state của React Query; kết quả thành công chứa timestamp người thực hiện và version
 * mới do backend trả về.
 * @remarks POST `/prescriptions/:prescriptionId/dispenses` với `expectedVersion` và confirmation, kèm
 * `Idempotency-Key`; yêu cầu `prescription.dispense`. Backend kiểm tra lại signed/paid/version và ghi nhận
 * cấp phát trong transaction; UI guard không thay thế authorization hoặc quyết định trừ kho.
 */
export function useDispensePrescription() {
  const invalidate = useInvalidateDispensableList();
  return useMutation({
    mutationFn: ({ prescriptionId, expectedVersion }: { prescriptionId: string; expectedVersion: number }) =>
      apiPost<DispensePrescriptionResult>(
        `/prescriptions/${prescriptionId}/dispenses`,
        { expectedVersion, dispenseConfirmation: true },
        { headers: { 'Idempotency-Key': createIdempotencyKey() } },
      ),
    onSuccess: invalidate,
  });
}

/**
 * Gửi command hủy/trả đơn với lý do bắt buộc.
 *
 * @returns Mutation state của React Query; thành công sẽ invalidate worklist.
 * @remarks POST `/prescriptions/:prescriptionId/cancel` với `expectedVersion` và `cancelReason`, yêu cầu
 * `prescription.cancel`. Backend mới kiểm tra transition, hóa đơn và hoàn movement nếu workflow cho phép;
 * client chỉ gửi lý do đã được UI thu thập.
 */
export function useRejectPrescription() {
  const invalidate = useInvalidateDispensableList();
  return useMutation({
    mutationFn: ({ prescriptionId, expectedVersion, cancelReason }: { prescriptionId: string; expectedVersion: number; cancelReason: string }) =>
      apiPost(`/prescriptions/${prescriptionId}/cancel`, { expectedVersion, cancelReason }),
    onSuccess: invalidate,
  });
}

/**
 * Gửi command kết xuất XML cho đơn đã ký.
 *
 * @returns Mutation state với status, thời điểm XML và version server trả về.
 * @remarks POST `/prescriptions/:prescriptionId/xml-exports` với `expectedVersion`, yêu cầu
 * `prescription.export`. Backend sinh/lưu file và chuyển trạng thái; client không tự tạo XML có giá trị
 * nghiệp vụ hoặc tự gán `xml_exported`.
 */
export function useExportPrescriptionXml() {
  const invalidate = useInvalidateDispensableList();
  return useMutation({
    mutationFn: ({ prescriptionId, expectedVersion }: { prescriptionId: string; expectedVersion: number }) =>
      apiPost<ExportPrescriptionXmlResult>(`/prescriptions/${prescriptionId}/xml-exports`, { expectedVersion }),
    onSuccess: invalidate,
  });
}

/**
 * Tải file XML đã được backend kết xuất.
 *
 * @param prescriptionId ID đơn thuốc cần tải.
 * @returns Promise hoàn tất sau khi trình duyệt đã kích hoạt tải file và thu hồi object URL.
 * @remarks GET `/prescriptions/:prescriptionId/xml-file`, response là Blob, yêu cầu `prescription.export`;
 * tên file ưu tiên `Content-Disposition`, fallback dùng tiền tố ID. Lỗi HTTP được truyền về caller xử lý.
 */
export async function downloadPrescriptionXmlFile(prescriptionId: string): Promise<void> {
  const response = await httpClient.get<Blob>(`/prescriptions/${prescriptionId}/xml-file`, {
    responseType: 'blob',
  });
  const disposition = response.headers['content-disposition'];
  const matchedFileName = typeof disposition === 'string'
    ? disposition.match(/filename="?([^"]+)"?/)?.[1]
    : undefined;
  const fileName = matchedFileName ?? `don-thuoc-${prescriptionId.slice(0, 8)}.xml`;
  const url = URL.createObjectURL(response.data);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName.replace(/[\\/\0]/g, '_');
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Đọc nội dung XML đã được backend kết xuất để preview.
 *
 * @param prescriptionId ID đơn thuốc cần xem XML.
 * @returns Promise chứa text UTF-8 đọc từ Blob response.
 * @remarks GET `/prescriptions/:prescriptionId/xml-file`, yêu cầu `prescription.export`; không tạo hoặc
 * cập nhật file/trạng thái, và lỗi HTTP được truyền về caller.
 */
export async function fetchPrescriptionXmlContent(prescriptionId: string): Promise<string> {
  const response = await httpClient.get<Blob>(`/prescriptions/${prescriptionId}/xml-file`, {
    responseType: 'blob',
  });
  return response.data.text();
}
