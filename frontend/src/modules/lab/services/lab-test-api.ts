import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
  apiPostMultipart,
  apiPut,
} from '@/shared/api-client';
import type {
  LabActivityStats,
  LabTestAttachment,
  LabTestDetail,
  LabTestQueueItem,
  LabTestStatus,
  LabTestType,
  ReferenceRangeRow,
  StructuredResult,
} from '../types/lab-test.types';

/** Query key gốc cho worklist; các filter được nối thêm để cache không trộn các tab. */
const QUEUE_QUERY_KEY = ['lab-tests', 'queue'] as const;

/** Tạo query key chi tiết theo mã phiếu để làm mới đúng bản ghi sau mutation. */
const DETAIL_QUERY_KEY = (labTestId: string) => ['lab-tests', 'detail', labTestId] as const;

/**
 * Tải worklist xét nghiệm theo trạng thái và cờ cấp cứu.
 *
 * @param filters Query `status`/`isUrgent`; bỏ trống `status` để lấy cả ba trạng thái server.
 * @param options Cho phép màn hình tắt query khi chưa có principal hoặc không ở worklist.
 * @returns Server state phân trang gồm các `LabTestQueueItem`, trạng thái tải và lỗi.
 * @remarks GET `/lab-tests` với `pageSize=100`; access và giới hạn theo khoa do backend quyết định.
 * Query key giữ từng bộ lọc; mutation xét nghiệm phải làm mới queue để dữ liệu được cập nhật.
 */
export function usePendingLabTests(
  filters: { status?: LabTestStatus; isUrgent?: boolean },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...QUEUE_QUERY_KEY, filters.status ?? 'all', filters.isUrgent],
    queryFn: () =>
      apiGetPaginated<LabTestQueueItem>('/lab-tests', {
        params: { status: filters.status, isUrgent: filters.isUrgent, pageSize: 100 },
      }),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Tải chi tiết một phiếu xét nghiệm để nhập kết quả hoặc xem lịch sử.
 *
 * @param labTestId Mã phiếu; `null` tắt query và trả trạng thái rỗng cho màn hình chưa chọn phiếu.
 * @returns Server state của `LabTestDetail`, gồm kết quả cấu trúc, khoảng tham chiếu và tệp.
 * @remarks GET `/lab-tests/:labTestId`; lỗi/permission được giữ ở React Query và backend là nơi
 * quyết định quyền đọc. Query bị vô hiệu hóa khi chưa có mã phiếu để tránh request không hợp lệ.
 */
export function useLabTestDetail(labTestId: string | null) {
  return useQuery({
    queryKey: DETAIL_QUERY_KEY(labTestId ?? ''),
    queryFn: () => apiGet<LabTestDetail>(`/lab-tests/${labTestId}`),
    enabled: Boolean(labTestId),
  });
}

/** Làm mới worklist và chi tiết liên quan sau khi trạng thái/kết quả phiếu thay đổi. */
function useInvalidateLabTestLists() {
  const queryClient = useQueryClient();
  return (labTestId: string) => {
    queryClient.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: DETAIL_QUERY_KEY(labTestId) });
  };
}

/**
 * Tiếp nhận mẫu khi mở luồng nhập kết quả cho phiếu đang chờ.
 *
 * @returns Mutation POST `/lab-tests/:labTestId/receive-specimen` và trạng thái thành công/lỗi.
 * @remarks Backend chuyển `ordered` sang `in_progress` (hoặc giữ trạng thái hợp lệ), kiểm tra
 * permission; thành công sẽ làm mới worklist và chi tiết để cập nhật trạng thái mẫu.
 */
export function useReceiveSpecimen() {
  const invalidate = useInvalidateLabTestLists();
  return useMutation({
    mutationFn: (labTestId: string) => apiPost(`/lab-tests/${labTestId}/receive-specimen`),
    onSuccess: (data, labTestId) => {
      void data;
      return invalidate(labTestId);
    },
  });
}

/**
 * Ghi kết quả có cấu trúc và xác nhận ký điện tử cho một phiếu xét nghiệm.
 *
 * @returns Mutation POST `/lab-tests/:labTestId/result`; payload gồm bảng kết quả, dữ liệu kết quả,
 * tệp bắt buộc và metadata báo cáo tùy chọn.
 * @remarks Backend xác minh `resultTableKey`, ownership của attachment và chuyển trạng thái phiếu;
 * lỗi validation/permission/version được trả qua mutation. Thành công làm mới queue/detail.
 */
export function useRecordLabResult() {
  const invalidate = useInvalidateLabTestLists();
  return useMutation({
    mutationFn: ({
      labTestId,
      ...input
    }: {
      labTestId: string;
      resultTableKey: string;
      structuredResult: StructuredResult;
      attachmentId: string;
      reportCode?: string;
      specimenType?: string;
      method?: string;
      conclusion?: string;
    }) =>
      apiPost(`/lab-tests/${labTestId}/result`, {
        ...input,
        signatureConfirmation: true,
        signatureMethod: 'dev_e_confirmation',
      }),
    onSuccess: (data, variables) => {
      void data;
      return invalidate(variables.labTestId);
    },
  });
}

/**
 * Lưu bản nháp workup giải phẫu bệnh mà chưa hoàn tất phiếu xét nghiệm.
 *
 * @returns Mutation PUT `/lab-tests/:labTestId/pathology-workup` với `structuredResult` đang nhập.
 * @remarks Backend giữ `LabTestStatus` chưa hoàn tất; thành công làm mới queue/detail để đồng bộ
 * dữ liệu máy chủ, còn lỗi được giữ trong mutation.
 */
export function useSavePathologyDraft() {
  const invalidate = useInvalidateLabTestLists();
  return useMutation({
    mutationFn: ({
      labTestId,
      structuredResult,
    }: {
      labTestId: string;
      structuredResult: StructuredResult;
    }) =>
      apiPut(`/lab-tests/${labTestId}/pathology-workup`, {
        resultTableKey: 'xn_mo_benh_hoc',
        structuredResult,
      }),
    onSuccess: (data, variables) => {
      void data;
      return invalidate(variables.labTestId);
    },
  });
}

/**
 * Upload tệp kết quả gắn với một phiếu xét nghiệm.
 *
 * @returns Mutation multipart POST `/attachments`, gửi `ownerType=lab_test`, `ownerId` và file;
 * response được chuẩn hóa thành metadata `LabTestAttachment`.
 * @remarks Input chỉ gợi ý MIME ở UI; backend mới kiểm tra PDF/PNG/JPEG, kích thước 1 byte–10 MB,
 * owner tồn tại và quyền `attachment.upload`. Hook không tự làm mới chi tiết vì caller giữ tệp.
 */
export function useUploadAttachment() {
  return useMutation({
    mutationFn: ({ ownerId, file }: { ownerId: string; file: File }) => {
      const formData = new FormData();
      formData.append('ownerType', 'lab_test');
      formData.append('ownerId', ownerId);
      formData.append('file', file);
      return apiPostMultipart<LabTestAttachment & { attachmentId: string }>(
        '/attachments',
        formData,
      );
    },
  });
}

/**
 * Tạo URL proxy tương đối để tải binary attachment qua phiên đăng nhập hiện tại.
 *
 * @param attachmentId Mã attachment do API trả về.
 * @returns URL GET proxy; endpoint backend tự kiểm tra xác thực, permission và integrity file.
 */
export function downloadAttachmentUrl(attachmentId: string): string {
  return `/api/proxy/attachments/${attachmentId}/file`;
}

/**
 * Tải danh mục loại xét nghiệm đang hoạt động.
 *
 * @returns Server state của mảng `LabTestType` từ GET `/lab-test-types`.
 * @remarks Dữ liệu dùng để chọn loại/chỉ số; access và trạng thái hoạt động do backend trả về,
 * lỗi query không bị biến đổi tại adapter.
 */
export function useLabTestTypes() {
  return useQuery({
    queryKey: ['lab-test-types'],
    queryFn: () => apiGet<LabTestType[]>('/lab-test-types'),
  });
}

/**
 * Cập nhật trường khoảng tham chiếu dạng text trên danh mục loại xét nghiệm.
 *
 * @returns Mutation PATCH `/lab-test-types/:labTestTypeId/reference-range` với `referenceRange`.
 * @remarks Backend kiểm tra permission quản lý catalog và giới hạn 255 ký tự; thành công làm mới
 * cache `lab-test-types` để các form chọn loại nhận dữ liệu mới.
 */
export function useUpdateReferenceRange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      labTestTypeId,
      referenceRange,
    }: {
      labTestTypeId: string;
      referenceRange: string;
    }) => apiPatch(`/lab-test-types/${labTestTypeId}/reference-range`, { referenceRange }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab-test-types'] }),
  });
}

/** Query key gốc cho bảng khoảng tham chiếu chi tiết và các thao tác làm mới cache. */
const REFERENCE_RANGES_QUERY_KEY = ['lab-tests', 'reference-ranges'] as const;

/**
 * Tải các dòng khoảng tham chiếu theo loại xét nghiệm hoặc từ khóa.
 *
 * @param filters Query `labTestTypeId` và `keyword`; keyword không gửi khi rỗng, page size cố định 100.
 * @returns Server state phân trang gồm `ReferenceRangeRow` đã chuẩn hóa từ API.
 * @remarks GET `/lab-tests/reference-ranges`; quyền đọc do backend kiểm tra. Query key tách theo
 * filter và được làm mới sau create/update/delete; lỗi giữ nguyên trong React Query.
 */
export function useReferenceRanges(filters: { labTestTypeId?: string; keyword?: string }) {
  return useQuery({
    queryKey: [...REFERENCE_RANGES_QUERY_KEY, filters.labTestTypeId, filters.keyword],
    queryFn: () =>
      apiGetPaginated<ReferenceRangeRow>('/lab-tests/reference-ranges', {
        params: {
          labTestTypeId: filters.labTestTypeId,
          keyword: filters.keyword || undefined,
          pageSize: 100,
        },
      }),
  });
}

/** Làm mới toàn bộ cache khoảng tham chiếu sau mutation để bảng phản ánh dữ liệu máy chủ. */
function useInvalidateReferenceRanges() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: REFERENCE_RANGES_QUERY_KEY });
}

/**
 * Tạo một dòng khoảng tham chiếu cho chỉ số xét nghiệm.
 *
 * @returns Mutation POST `/lab-tests/reference-ranges` trả về `ReferenceRangeRow`.
 * @remarks Payload gồm đơn vị, ngưỡng dưới/trên tùy chọn và điều kiện `all`/`male`/`female`;
 * backend là nơi kiểm tra field hợp lệ, trùng dữ liệu, permission và giới hạn số. Thành công làm mới bảng.
 */
export function useCreateReferenceRange() {
  const invalidate = useInvalidateReferenceRanges();
  return useMutation({
    mutationFn: (input: {
      labTestTypeId: string;
      fieldKey: string;
      code: string;
      label: string;
      unit?: string;
      lowerBound?: string;
      upperBound?: string;
      condition: 'all' | 'male' | 'female';
    }) => apiPost<ReferenceRangeRow>('/lab-tests/reference-ranges', input),
    onSuccess: invalidate,
  });
}

/**
 * Cập nhật nhãn, đơn vị, ngưỡng hoặc điều kiện của một khoảng tham chiếu.
 *
 * @returns Mutation PATCH `/lab-tests/reference-ranges/:referenceRangeId` trả về dòng đã chuẩn hóa.
 * @remarks Chỉ gửi các field thay đổi; backend kiểm tra ngưỡng, permission và lỗi not-found. Thành công
 * làm mới cache khoảng tham chiếu.
 */
export function useUpdateReferenceRangeDetail() {
  const invalidate = useInvalidateReferenceRanges();
  return useMutation({
    mutationFn: ({
      referenceRangeId,
      ...input
    }: {
      referenceRangeId: string;
      label?: string;
      unit?: string;
      lowerBound?: string;
      upperBound?: string;
      condition?: 'all' | 'male' | 'female';
    }) => apiPatch<ReferenceRangeRow>(`/lab-tests/reference-ranges/${referenceRangeId}`, input),
    onSuccess: invalidate,
  });
}

/**
 * Xóa mềm một dòng khoảng tham chiếu.
 *
 * @returns Mutation DELETE `/lab-tests/reference-ranges/:referenceRangeId`.
 * @remarks Backend kiểm tra permission quản lý catalog; lỗi not-found/authorization được giữ ở
 * mutation. Thành công làm mới cache để dòng bị xóa không còn trong danh sách.
 */
export function useDeleteReferenceRange() {
  const invalidate = useInvalidateReferenceRanges();
  return useMutation({
    mutationFn: (referenceRangeId: string) =>
      apiDelete(`/lab-tests/reference-ranges/${referenceRangeId}`),
    onSuccess: invalidate,
  });
}

/**
 * Tải thống kê hoạt động xét nghiệm theo kỳ và ngày tùy chọn.
 *
 * @param filters `period` là `today`/`week`/`month`; `date` là chuỗi ngày theo hợp đồng API.
 * @returns Server state `LabActivityStats`, trong đó TAT tính bằng phút và phân bố theo giờ.
 * @remarks GET `/lab-tests/stats`; access do permission backend quyết định, lỗi query được giữ trong
 * React Query và cache tách theo period/date.
 */
export function useLabActivityStats(filters: {
  period: 'today' | 'week' | 'month';
  date?: string;
}) {
  return useQuery({
    queryKey: ['lab-tests', 'stats', filters.period, filters.date],
    queryFn: () => apiGet<LabActivityStats>('/lab-tests/stats', { params: filters }),
  });
}
