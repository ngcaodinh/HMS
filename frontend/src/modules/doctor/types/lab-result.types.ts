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
