import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/shared/api-client';
import type { LabResultDetail } from '../types/lab-result.types';

export function useLabTestResult(labTestId: string | null) {
  return useQuery({
    queryKey: ['lab-tests', 'detail', labTestId],
    queryFn: () => apiGet<LabResultDetail>(`/lab-tests/${labTestId}`),
    enabled: Boolean(labTestId),
  });
}

export function downloadLabAttachmentUrl(attachmentId: string): string {
  return `/api/proxy/attachments/${attachmentId}/file`;
}
