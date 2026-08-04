import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGetPaginated, apiPost, httpClient } from '@/shared/api-client';
import type { DispensablePrescription } from '../types/prescription-dispense.types';

const LIST_QUERY_KEY = ['prescriptions', 'dispensable'] as const;

interface DispensePrescriptionResult {
  dispensedAt: string | null;
  dispensedBy: string | null;
  prescriptionId: string;
  version: number;
}

interface ExportPrescriptionXmlResult {
  prescriptionId: string;
  status: 'xml_exported';
  xmlExportedAt: string | null;
  version: number;
}

export function createIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `dispense-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

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

function useInvalidateDispensableList() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: LIST_QUERY_KEY });
}

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

export function useRejectPrescription() {
  const invalidate = useInvalidateDispensableList();
  return useMutation({
    mutationFn: ({ prescriptionId, expectedVersion, cancelReason }: { prescriptionId: string; expectedVersion: number; cancelReason: string }) =>
      apiPost(`/prescriptions/${prescriptionId}/cancel`, { expectedVersion, cancelReason }),
    onSuccess: invalidate,
  });
}

export function useExportPrescriptionXml() {
  const invalidate = useInvalidateDispensableList();
  return useMutation({
    mutationFn: ({ prescriptionId, expectedVersion }: { prescriptionId: string; expectedVersion: number }) =>
      apiPost<ExportPrescriptionXmlResult>(`/prescriptions/${prescriptionId}/xml-exports`, { expectedVersion }),
    onSuccess: invalidate,
  });
}

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

/** Đọc XML đã kết xuất để preview; endpoint vẫn trả blob nhằm giữ đúng content type tải file. */
export async function fetchPrescriptionXmlContent(prescriptionId: string): Promise<string> {
  const response = await httpClient.get<Blob>(`/prescriptions/${prescriptionId}/xml-file`, {
    responseType: 'blob',
  });
  return response.data.text();
}
