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

export function useDoctorWorklist(doctorId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: doctorWorklistQueryKey(doctorId),
    queryFn: () =>
      apiGetPaginated<WorklistItem>('/medical-records/worklist', { params: { pageSize: 50 } }),
    refetchInterval: 30_000,
    enabled: Boolean(doctorId) && enabled,
  });
}

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

export function useLabTestTypes(keyword: string) {
  return useQuery({
    queryKey: ['lab-test-types', keyword],
    queryFn: () =>
      apiGet<LabTestTypeOption[]>('/lab-test-types', { params: { keyword: keyword || undefined } }),
  });
}

export function useLabResultDetail(labTestId: string | null) {
  return useQuery({
    queryKey: ['lab-tests', 'detail', labTestId],
    queryFn: () => apiGet<LabTestResultDetail>(`/lab-tests/${labTestId}`),
    enabled: Boolean(labTestId),
  });
}

export function downloadAttachmentUrl(attachmentId: string): string {
  return `/api/proxy/attachments/${attachmentId}/file`;
}

function useInvalidateRecord(recordId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      predicate: (query) => shouldInvalidateMedicalRecordQuery(recordId, query.queryKey),
    });
}

/** Làm mới worklist và hồ sơ chi tiết sau lỗi version conflict hoặc mutation nghiệp vụ. */
export function useRefreshMedicalRecord(recordId: string) {
  return useInvalidateRecord(recordId);
}

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
