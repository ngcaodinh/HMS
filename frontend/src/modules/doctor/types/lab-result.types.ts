/**
 * Hợp đồng rút gọn để màn hình bác sĩ đọc kết quả xét nghiệm và tệp liên quan.
 * Status gồm `ordered`, `in_progress` hoặc `resulted`; các mốc thời gian là ISO datetime do API.
 * `structuredResult` và `fileType` giữ nguyên dữ liệu wire để UI chọn bảng/loại tệp tương ứng.
 */
export interface LabResultDetail {
  labTestId: string;
  status: 'ordered' | 'in_progress' | 'resulted';
  resultTableKey: string;
  conclusion: string | null;
  resultedAt: string | null;
  signedAt: string | null;
  structuredResult: Record<string, unknown> | null;
  attachments: Array<{ attachmentId: string; originalName: string; fileType: string }>;
}
