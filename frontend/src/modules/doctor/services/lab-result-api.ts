import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/shared/api-client';
import type { LabResultDetail } from '../types/lab-result.types';

/** Adapter hook cho kết quả xét nghiệm và URL tải tệp; apiGet unwrap `data`, còn lỗi ApiError được query trả cho caller. */

/**
 * Tải kết quả xét nghiệm cho tab kết quả của hồ sơ bác sĩ.
 * @param labTestId Mã xét nghiệm; `null` khiến query không gửi request.
 * @returns Query chứa `LabResultDetail`, loading state và lỗi chuẩn hóa từ API client.
 * @remarks Gọi `GET /lab-tests/:labTestId` với khóa `lab-tests/detail/:labTestId`; backend quyết
 *   định quyền xem và trạng thái có thể hiển thị.
 */
export function useLabTestResult(labTestId: string | null) {
  return useQuery({
    queryKey: ['lab-tests', 'detail', labTestId],
    queryFn: () => apiGet<LabResultDetail>(`/lab-tests/${labTestId}`),
    enabled: Boolean(labTestId),
  });
}

/**
 * Tạo URL proxy để mở tệp đính kèm của kết quả xét nghiệm.
 * @param attachmentId Mã tệp opaque trong path proxy.
 * @returns URL tương đối; hàm không tự tải và không ánh xạ lỗi HTTP.
 * @remarks BFF/backend kiểm tra authentication, permission và trả lỗi khi URL được mở.
 */
export function downloadLabAttachmentUrl(attachmentId: string): string {
  return `/api/proxy/attachments/${attachmentId}/file`;
}
