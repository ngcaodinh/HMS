import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPost } from '@/shared/api-client';
import type {
  LatestPrescriptionResponse,
  MedicineOption,
  Prescription,
} from '../types/prescription.types';
import { shouldInvalidateMedicalRecordQuery } from './medical-record-cache';

export function useMedicines(keyword: string) {
  return useQuery({
    queryKey: ['medicines', keyword],
    queryFn: () =>
      apiGet<MedicineOption[]>('/medicines', { params: { keyword: keyword || undefined } }),
  });
}

export function useLatestPrescription(recordId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['prescriptions', 'latest', recordId],
    queryFn: () =>
      apiGet<LatestPrescriptionResponse>(`/medical-records/${recordId}/prescriptions/latest`),
    enabled: Boolean(recordId) && enabled,
  });
}

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
