import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiGetPaginated, apiPost } from '@/shared/api-client';
import type {
  DiagnoseInput,
  Icd10Entry,
  LabTestResultDetail,
  LabTestTypeOption,
  MedicalRecordDetail,
  VitalSignsFormInput,
  WorklistItem,
} from '../types/medical-record.types';
import {
  doctorWorklistQueryKey,
  medicalRecordDetailQueryKey,
  shouldInvalidateMedicalRecordQuery,
} from './medical-record-cache';

/** Adapter hook cho medical record, catalog ICD-10 và chỉ định xét nghiệm; apiGet/apiPost unwrap `data`, còn ApiError được React Query giữ cho caller. */

/**
 * Tải worklist hồ sơ khám dành cho bác sĩ hiện tại.
 * @param doctorId Mã người dùng dùng cho cache và điều kiện bật query; không được gửi thành query
 *   param vì server lấy phạm vi bác sĩ từ session đã xác thực.
 * @param enabled Cho phép caller trì hoãn request khi session chưa xác thực.
 * @returns Query React Query chứa danh sách phân trang và trạng thái loading/error.
 * @remarks Gọi `GET /medical-records/worklist` với `pageSize=50`, tự làm mới mỗi 30 giây; lỗi
 *   được giữ ở query để UI hiển thị. UI visibility không thay thế authorization phía backend.
 */
export function useDoctorWorklist(doctorId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: doctorWorklistQueryKey(doctorId),
    queryFn: () =>
      apiGetPaginated<WorklistItem>('/medical-records/worklist', { params: { pageSize: 50 } }),
    refetchInterval: 30_000,
    enabled: Boolean(doctorId) && enabled,
  });
}

/**
 * Tải aggregate chi tiết của hồ sơ đang được bác sĩ mở.
 * @param recordId Mã hồ sơ dùng trong path `GET /medical-records/:recordId`.
 * @param viewerId Mã người xem dùng cho cache namespace và điều kiện access ở session.
 * @param enabled Cho phép caller bật request sau khi có session và hồ sơ.
 * @returns Query chứa `viewType` cùng `MedicalRecordDetail`, hoặc lỗi chuẩn hóa từ API client.
 * @remarks Query bị tắt khi thiếu mã hồ sơ, người xem hoặc cờ enabled; server vẫn là nơi quyết
 *   định quyền đọc hồ sơ.
 */
export function useMedicalRecordDetail(
  recordId: string | null,
  viewerId: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: medicalRecordDetailQueryKey(viewerId, recordId),
    queryFn: () =>
      apiGet<{ viewType: string; record: MedicalRecordDetail }>(`/medical-records/${recordId}`),
    enabled: Boolean(recordId) && Boolean(viewerId) && enabled,
  });
}

/**
 * Tra cứu danh mục ICD-10 theo từ khóa hiện tại.
 * @param keyword Từ khóa tìm kiếm; chỉ query khi sau trim còn ký tự.
 * @returns Query danh sách mục ICD-10 và trạng thái request.
 * @remarks Gọi `GET /clinical-catalogs/icd-10` với `effectiveDate` dạng `YYYY-MM-DD` và keyword;
 *   lỗi catalog do API client/React Query chuyển cho caller.
 */
export function useIcd10Catalog(keyword: string) {
  return useQuery({
    queryKey: ['clinical-catalogs', 'icd-10', keyword],
    queryFn: () =>
      apiGet<Icd10Entry[]>('/clinical-catalogs/icd-10', {
        params: {
          effectiveDate: new Date().toISOString().slice(0, 10),
          keyword: keyword || undefined,
        },
      }),
    enabled: keyword.trim().length > 0,
  });
}

/**
 * Tra cứu loại xét nghiệm để tạo chỉ định.
 * @param keyword Từ khóa tùy chọn gửi trong query `keyword` của `GET /lab-test-types`.
 * @returns Query danh sách lựa chọn xét nghiệm và trạng thái request.
 * @remarks API/backend quyết định danh mục và quyền truy cập; hook không tự lọc hay sửa giá.
 */
export function useLabTestTypes(keyword: string) {
  return useQuery({
    queryKey: ['lab-test-types', keyword],
    queryFn: () =>
      apiGet<LabTestTypeOption[]>('/lab-test-types', { params: { keyword: keyword || undefined } }),
  });
}

/**
 * Tải chi tiết kết quả xét nghiệm theo mã xét nghiệm.
 * @param labTestId Mã xét nghiệm; `null` giữ query ở trạng thái disabled.
 * @returns Query chứa chi tiết kết quả hoặc lỗi chuẩn hóa từ API client.
 * @remarks Gọi `GET /lab-tests/:labTestId`; quyền xem và trạng thái kết quả do backend quyết định.
 */
export function useLabResultDetail(labTestId: string | null) {
  return useQuery({
    queryKey: ['lab-tests', 'detail', labTestId],
    queryFn: () => apiGet<LabTestResultDetail>(`/lab-tests/${labTestId}`),
    enabled: Boolean(labTestId),
  });
}

/**
 * Tạo URL proxy để tải tệp đính kèm xét nghiệm.
 * @param attachmentId Mã tệp opaque dùng trong path proxy.
 * @returns URL tương đối `/api/proxy/attachments/:attachmentId/file`; hàm chưa tự gửi request.
 * @remarks Quyền tải và lỗi HTTP được xử lý ở BFF/backend khi trình duyệt mở URL.
 */
export function downloadAttachmentUrl(attachmentId: string): string {
  return `/api/proxy/attachments/${attachmentId}/file`;
}

/**
 * Tạo callback làm mới cache chung cho các mutation cập nhật hồ sơ.
 * @param recordId Mã hồ sơ vừa thay đổi.
 * @returns Callback làm mới worklist và chi tiết đúng hồ sơ qua predicate của React Query.
 * @remarks Giới hạn việc làm mới theo cấu trúc khóa giúp dữ liệu y tế của hồ sơ khác không bị
 *   làm mới hoặc dùng nhầm trong session hiện tại.
 */
function useInvalidateRecord(recordId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      predicate: (query) => shouldInvalidateMedicalRecordQuery(recordId, query.queryKey),
    });
}

/** Làm mới worklist và hồ sơ chi tiết sau version conflict hoặc mutation nghiệp vụ. */
export function useRefreshMedicalRecord(recordId: string) {
  return useInvalidateRecord(recordId);
}

/**
 * Ghi sinh hiệu và đánh giá ban đầu cho hồ sơ.
 * @param recordId Mã hồ sơ trong path POST.
 * @returns Mutation React Query; khi thành công sẽ làm mới worklist và chi tiết hồ sơ.
 * @remarks Body gồm `expectedVersion`, sinh hiệu, lý do khám và các trường đánh giá tùy chọn;
 *   API quyết định validation, lỗi field và quyền ghi.
 */
export function useRecordVitalSignsAndAssessment(recordId: string) {
  const invalidate = useInvalidateRecord(recordId);
  return useMutation({
    mutationFn: (
      input: VitalSignsFormInput & {
        expectedVersion: number;
        chiefComplaint: string;
        heightCm?: number;
        historyOfPresentIllness?: string;
      },
    ) => apiPost(`/medical-records/${recordId}/vital-signs-with-assessment`, input),
    onSuccess: invalidate,
  });
}

/**
 * Tạo các chỉ định xét nghiệm cho hồ sơ.
 * @param recordId Mã hồ sơ trong path `POST /medical-records/:recordId/lab-tests`.
 * @returns Mutation React Query; khi thành công sẽ làm mới worklist và chi tiết hồ sơ.
 * @remarks Body giữ `expectedRecordVersion` và danh sách `labTestTypeId`/`isUrgent`; lỗi và
 *   quyền chỉ định do API/backend quyết định.
 */
export function useOrderLabTests(recordId: string) {
  const invalidate = useInvalidateRecord(recordId);
  return useMutation({
    mutationFn: (input: {
      expectedRecordVersion: number;
      items: Array<{ labTestTypeId: string; isUrgent?: boolean }>;
    }) => apiPost(`/medical-records/${recordId}/lab-tests`, input),
    onSuccess: invalidate,
  });
}

/**
 * Ghi chẩn đoán và xác nhận chữ ký theo hợp đồng hiện tại của API.
 * @param recordId Mã hồ sơ trong path `POST /medical-records/:recordId/diagnosis`.
 * @returns Mutation React Query; khi thành công sẽ làm mới worklist và chi tiết hồ sơ.
 * @remarks Input giữ version, ICD-10, nội dung và loại điều trị; hook truyền thêm cờ xác nhận
 *   chữ ký hiện tại, còn backend vẫn là authority cho signature và chuyển trạng thái hồ sơ.
 */
export function useDiagnoseMedicalRecord(recordId: string) {
  const invalidate = useInvalidateRecord(recordId);
  return useMutation({
    mutationFn: (input: DiagnoseInput) =>
      apiPost(`/medical-records/${recordId}/diagnosis`, {
        ...input,
        signatureConfirmation: true,
        signatureMethod: 'dev_e_confirmation',
      }),
    onSuccess: invalidate,
  });
}
