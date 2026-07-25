import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost, apiPostMultipart, apiPut } from '@/shared/api-client';
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

const QUEUE_QUERY_KEY = ['lab-tests', 'queue'] as const;
const DETAIL_QUERY_KEY = (labTestId: string) => ['lab-tests', 'detail', labTestId] as const;

/** `status` bỏ trống trả về cả 3 trạng thái (khớp tab "Tất cả" trong ảnh mẫu). */
export function usePendingLabTests(filters: { status?: LabTestStatus; isUrgent?: boolean }) {
  return useQuery({
    queryKey: [...QUEUE_QUERY_KEY, filters.status ?? 'all', filters.isUrgent],
    queryFn: () =>
      apiGetPaginated<LabTestQueueItem>('/lab-tests', {
        params: { status: filters.status, isUrgent: filters.isUrgent, pageSize: 100 },
      }),
  });
}

export function useLabTestDetail(labTestId: string | null) {
  return useQuery({
    queryKey: DETAIL_QUERY_KEY(labTestId ?? ''),
    queryFn: () => apiGet<LabTestDetail>(`/lab-tests/${labTestId}`),
    enabled: Boolean(labTestId),
  });
}

function useInvalidateLabTestLists() {
  const queryClient = useQueryClient();
  return (labTestId: string) => {
    queryClient.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: DETAIL_QUERY_KEY(labTestId) });
  };
}

/** "Tiếp nhận mẫu" — gọi tự động khi mở màn Nhập kết quả cho 1 phiếu đang chờ mẫu. */
export function useReceiveSpecimen() {
  const invalidate = useInvalidateLabTestLists();
  return useMutation({
    mutationFn: (labTestId: string) => apiPost(`/lab-tests/${labTestId}/receive-specimen`),
    onSuccess: (_data, labTestId) => invalidate(labTestId),
  });
}

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
    onSuccess: (_data, variables) => invalidate(variables.labTestId),
  });
}

export function useSavePathologyDraft() {
  const invalidate = useInvalidateLabTestLists();
  return useMutation({
    mutationFn: ({ labTestId, structuredResult }: { labTestId: string; structuredResult: StructuredResult }) =>
      apiPut(`/lab-tests/${labTestId}/pathology-workup`, { resultTableKey: 'xn_mo_benh_hoc', structuredResult }),
    onSuccess: (_data, variables) => invalidate(variables.labTestId),
  });
}

export function useUploadAttachment() {
  return useMutation({
    mutationFn: ({ ownerId, file }: { ownerId: string; file: File }) => {
      const formData = new FormData();
      formData.append('ownerType', 'lab_test');
      formData.append('ownerId', ownerId);
      formData.append('file', file);
      return apiPostMultipart<LabTestAttachment & { attachmentId: string }>('/attachments', formData);
    },
  });
}

export function downloadAttachmentUrl(attachmentId: string): string {
  return `/api/proxy/attachments/${attachmentId}/file`;
}

export function useLabTestTypes() {
  return useQuery({
    queryKey: ['lab-test-types'],
    queryFn: () => apiGet<LabTestType[]>('/lab-test-types'),
  });
}

export function useUpdateReferenceRange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ labTestTypeId, referenceRange }: { labTestTypeId: string; referenceRange: string }) =>
      apiPatch(`/lab-test-types/${labTestTypeId}/reference-range`, { referenceRange }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab-test-types'] }),
  });
}

const REFERENCE_RANGES_QUERY_KEY = ['lab-tests', 'reference-ranges'] as const;

export function useReferenceRanges(filters: { labTestTypeId?: string; keyword?: string }) {
  return useQuery({
    queryKey: [...REFERENCE_RANGES_QUERY_KEY, filters.labTestTypeId, filters.keyword],
    queryFn: () =>
      apiGetPaginated<ReferenceRangeRow>('/lab-tests/reference-ranges', {
        params: { labTestTypeId: filters.labTestTypeId, keyword: filters.keyword || undefined, pageSize: 100 },
      }),
  });
}

function useInvalidateReferenceRanges() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: REFERENCE_RANGES_QUERY_KEY });
}

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

export function useDeleteReferenceRange() {
  const invalidate = useInvalidateReferenceRanges();
  return useMutation({
    mutationFn: (referenceRangeId: string) => apiDelete(`/lab-tests/reference-ranges/${referenceRangeId}`),
    onSuccess: invalidate,
  });
}

export function useLabActivityStats(filters: { period: 'today' | 'week' | 'month'; date?: string }) {
  return useQuery({
    queryKey: ['lab-tests', 'stats', filters.period, filters.date],
    queryFn: () => apiGet<LabActivityStats>('/lab-tests/stats', { params: filters }),
  });
}
