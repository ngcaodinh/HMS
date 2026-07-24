import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api-client';
import type {
  DiagnoseInput,
  Icd10Entry,
  LabTestTypeOption,
  MedicalRecordDetail,
  VitalSignsFormInput,
  WorklistItem,
} from '../types/medical-record.types';

export function useDoctorWorklist(enabled: boolean) {
  return useQuery({
    queryKey: ['medical-records', 'worklist'],
    queryFn: () => apiGetPaginated<WorklistItem>('/medical-records/worklist', { params: { pageSize: 50 } }),
    refetchInterval: 30_000,
    enabled,
  });
}

export function useMedicalRecordDetail(recordId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['medical-records', recordId],
    queryFn: () => apiGet<{ viewType: string; record: MedicalRecordDetail }>(`/medical-records/${recordId}`),
    enabled: Boolean(recordId) && enabled,
  });
}

export function useIcd10Catalog(keyword: string) {
  return useQuery({
    queryKey: ['clinical-catalogs', 'icd-10', keyword],
    queryFn: () =>
      apiGet<Icd10Entry[]>('/clinical-catalogs/icd-10', {
        params: { effectiveDate: new Date().toISOString().slice(0, 10), keyword: keyword || undefined },
      }),
    enabled: keyword.trim().length > 0,
  });
}

export function useLabTestTypes(keyword: string) {
  return useQuery({
    queryKey: ['lab-test-types', keyword],
    queryFn: () => apiGet<LabTestTypeOption[]>('/lab-test-types', { params: { keyword: keyword || undefined } }),
  });
}

function useInvalidateRecord(recordId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['medical-records', recordId] });
    queryClient.invalidateQueries({ queryKey: ['medical-records', 'worklist'] });
  };
}

export function useRecordVitalSigns(recordId: string) {
  const invalidate = useInvalidateRecord(recordId);
  return useMutation({
    mutationFn: (input: VitalSignsFormInput) => apiPost(`/medical-records/${recordId}/vital-signs`, input),
    onSuccess: invalidate,
  });
}

export function useUpdateClinicalAssessment(recordId: string) {
  const invalidate = useInvalidateRecord(recordId);
  return useMutation({
    mutationFn: (input: { expectedVersion: number; chiefComplaint?: string; historyOfPresentIllness?: string }) =>
      apiPatch(`/medical-records/${recordId}/clinical-assessment`, input),
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
