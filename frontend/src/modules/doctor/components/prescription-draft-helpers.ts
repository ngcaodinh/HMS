import type { DraftRxLine } from '../types/prescription.types';

export interface PrescriptionDraftResetState {
  allergyOverrideReason: string | null;
  lineErrors: Record<string, string>;
  lines: DraftRxLine[];
}

/** Xoá dữ liệu chỉ dành cho các dòng thuốc khi bác sĩ xác nhận không dùng thuốc. */
export function resetDraftForNoDrug(): PrescriptionDraftResetState {
  return {
    allergyOverrideReason: null,
    lineErrors: {},
    lines: [],
  };
}
