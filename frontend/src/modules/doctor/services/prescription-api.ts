import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPost } from '@/shared/api-client';
import type {
  LatestPrescriptionResponse,
  MedicineOption,
  Prescription,
} from '../types/prescription.types';
import { shouldInvalidateMedicalRecordQuery } from './medical-record-cache';

/** Adapter hook cho tra cứu, ghi nhận, ký, hủy và export đơn thuốc; apiGet/apiPost unwrap `data`, còn lỗi được React Query trả cho caller. */

/**
 * Tra cứu danh mục thuốc theo từ khóa nhập trên màn hình kê đơn.
 * @param keyword Từ khóa tùy chọn gửi trong query `keyword` của `GET /medicines`.
 * @returns Query danh sách thuốc và trạng thái loading/error.
 * @remarks Giá, hoạt chất và cờ BHYT được lấy từ server; hook không tự tính hoặc quyết định thuốc.
 */
export function useMedicines(keyword: string) {
  return useQuery({
    queryKey: ['medicines', keyword],
    queryFn: () =>
      apiGet<MedicineOption[]>('/medicines', { params: { keyword: keyword || undefined } }),
  });
}

/**
 * Lấy đơn thuốc gần nhất của hồ sơ.
 * @param recordId Mã hồ sơ trong path `GET /medical-records/:recordId/prescriptions/latest`.
 * @param enabled Cờ cho phép request sau khi hồ sơ đã đủ điều kiện hiển thị.
 * @returns Query có thể trả `prescription: null` và cờ `hasActivePrescription`.
 * @remarks Cache tách theo recordId; access và trạng thái draft/active do backend quyết định.
 */
export function useLatestPrescription(recordId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['prescriptions', 'latest', recordId],
    queryFn: () =>
      apiGet<LatestPrescriptionResponse>(`/medical-records/${recordId}/prescriptions/latest`),
    enabled: Boolean(recordId) && enabled,
  });
}

/**
 * Tạo callback làm mới cache sau mutation đơn thuốc.
 * @param recordId Mã hồ sơ liên quan đến đơn thuốc.
 * @returns Callback làm mới đơn gần nhất, worklist và chi tiết hồ sơ liên quan.
 * @remarks Hai nhóm query được làm mới cùng lúc để patient header và màn hình kê đơn không
 *   giữ snapshot cũ sau khi server thay đổi trạng thái đơn.
 */
function useInvalidatePrescription(recordId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['prescriptions', 'latest', recordId] }),
      queryClient.invalidateQueries({
        predicate: (query) => shouldInvalidateMedicalRecordQuery(recordId, query.queryKey),
      }),
    ]);
}

/**
 * Tạo đơn thuốc nháp cho hồ sơ.
 * @param recordId Mã hồ sơ trong path `POST /medical-records/:recordId/prescriptions`.
 * @returns Mutation trả `Prescription`; khi thành công làm mới cache đơn và hồ sơ.
 * @remarks Body gồm expectedRecordVersion, các dòng thuốc và các xác nhận tùy chọn; server kiểm
 *   tra giới hạn kê đơn, dị ứng và quyền ghi, còn lỗi được chuyển qua React Query.
 */
export function useCreatePrescriptionDraft(recordId: string) {
  const invalidate = useInvalidatePrescription(recordId);
  return useMutation({
    mutationFn: (input: {
      expectedRecordVersion: number;
      items: Array<{
        medicineId: string;
        quantity: number;
        days: number;
        dosePerUse: string;
        useTiming: string;
        dosageInstruction: string;
      }>;
      noDrugConfirmation?: boolean;
      longTermReason?: string;
      allergyOverrideReason?: string;
    }) => apiPost<Prescription>(`/medical-records/${recordId}/prescriptions`, input),
    onSuccess: invalidate,
  });
}

/**
 * Ký đơn thuốc theo version hiện tại.
 * @param recordId Mã hồ sơ dùng để làm mới cache sau mutation.
 * @returns Mutation POST `/prescriptions/:prescriptionId/sign` trả đơn đã cập nhật.
 * @remarks Body giữ expectedVersion và lý do override dị ứng tùy chọn; hook truyền cờ xác nhận
 *   chữ ký theo contract hiện tại, còn backend quyết định điều kiện ký và trạng thái active.
 */
export function useSignPrescription(recordId: string) {
  const invalidate = useInvalidatePrescription(recordId);
  return useMutation({
    mutationFn: ({
      prescriptionId,
      ...input
    }: {
      prescriptionId: string;
      expectedVersion: number;
      allergyOverrideReason?: string;
    }) =>
      apiPost<Prescription>(`/prescriptions/${prescriptionId}/sign`, {
        ...input,
        signatureConfirmation: true,
        signatureMethod: 'dev_e_confirmation',
      }),
    onSuccess: invalidate,
  });
}

/**
 * Hủy đơn thuốc đã chọn.
 * @param recordId Mã hồ sơ dùng để làm mới cache sau mutation.
 * @returns Mutation POST `/prescriptions/:prescriptionId/cancel` trả đơn đã cập nhật.
 * @remarks Body gồm expectedVersion và cancelReason; server quyết định quyền và chuyển trạng thái,
 *   lỗi validation/conflict được giữ ở mutation.
 */
export function useCancelPrescription(recordId: string) {
  const invalidate = useInvalidatePrescription(recordId);
  return useMutation({
    mutationFn: ({
      prescriptionId,
      ...input
    }: {
      prescriptionId: string;
      expectedVersion: number;
      cancelReason: string;
    }) => apiPost<Prescription>(`/prescriptions/${prescriptionId}/cancel`, input),
    onSuccess: invalidate,
  });
}

/**
 * Yêu cầu export XML của đơn thuốc.
 * @param recordId Mã hồ sơ dùng để làm mới cache sau mutation.
 * @returns Mutation POST `/prescriptions/:prescriptionId/xml-exports`, trả endpoint download.
 * @remarks Body chỉ gửi expectedVersion; hook làm mới cache nhưng không tự tải file hoặc đổi trạng
 *   thái cục bộ khi backend từ chối request.
 */
export function useExportPrescriptionXml(recordId: string) {
  const invalidate = useInvalidatePrescription(recordId);
  return useMutation({
    mutationFn: ({
      prescriptionId,
      expectedVersion,
    }: {
      prescriptionId: string;
      expectedVersion: number;
    }) =>
      apiPost<{ download: { endpoint: string } }>(`/prescriptions/${prescriptionId}/xml-exports`, {
        expectedVersion,
      }),
    onSuccess: invalidate,
  });
}
