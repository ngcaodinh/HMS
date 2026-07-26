import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGetPaginated, apiPost } from '@/shared/api-client';
import type { DispensablePrescription } from '../types/prescription-dispense.types';

const LIST_QUERY_KEY = ['prescriptions', 'dispensable'] as const;

export function useDispensablePrescriptions(filters: { keyword: string; dispensed: boolean }) {
  return useQuery({
    queryKey: [...LIST_QUERY_KEY, filters.keyword, filters.dispensed],
    queryFn: () =>
      apiGetPaginated<DispensablePrescription>('/prescriptions', {
        params: { keyword: filters.keyword || undefined, dispensed: filters.dispensed, pageSize: 100 },
      }),
  });
}

function useInvalidateDispensableList() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: LIST_QUERY_KEY });
}

export function useDispensePrescription() {
  const invalidate = useInvalidateDispensableList();
  return useMutation({
    mutationFn: ({ prescriptionId, expectedVersion }: { prescriptionId: string; expectedVersion: number }) =>
      apiPost(`/prescriptions/${prescriptionId}/dispenses`, { expectedVersion, dispenseConfirmation: true }),
    onSuccess: invalidate,
  });
}

export function useRejectPrescription() {
  const invalidate = useInvalidateDispensableList();
  return useMutation({
    mutationFn: ({ prescriptionId, expectedVersion, cancelReason }: { prescriptionId: string; expectedVersion: number; cancelReason: string }) =>
      apiPost(`/prescriptions/${prescriptionId}/cancel`, { expectedVersion, cancelReason }),
    onSuccess: invalidate,
  });
}
