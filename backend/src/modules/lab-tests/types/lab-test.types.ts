import type { z } from 'zod';

import type {
  bioChemistryResultSchema,
  cbcResultSchema,
  createReferenceRangeSchema,
  labActivityStatsQuerySchema,
  listReferenceRangesQuerySchema,
  microbiologyResultSchema,
  pathologyResultSchema,
  recordLabResultSchema,
  savePathologyWorkupDraftSchema,
  updateReferenceRangeDetailSchema,
  urinalysisResultSchema,
} from '../schemas/lab-test.schemas';

export type CbcResult = z.infer<typeof cbcResultSchema>;
export type UrinalysisResult = z.infer<typeof urinalysisResultSchema>;
export type MicrobiologyResult = z.infer<typeof microbiologyResultSchema>;
export type PathologyResult = z.infer<typeof pathologyResultSchema>;
export type BioChemistryResult = z.infer<typeof bioChemistryResultSchema>;

/** Duplicated here (rather than hand-written) because the discriminated union spans 5 structurally
 * unrelated variants (30+ field antibiogram vs plain CBC numbers) — z.infer avoids re-typing each. */
export type RecordLabResultInput = z.infer<typeof recordLabResultSchema>;
export type SavePathologyWorkupDraftInput = z.infer<typeof savePathologyWorkupDraftSchema>;

export interface ListPendingLabTestsQuery {
  status?: 'ordered' | 'in_progress' | 'resulted';
  isUrgent?: boolean;
  page: number;
  pageSize: number;
}

export type ListReferenceRangesQuery = z.infer<typeof listReferenceRangesQuerySchema>;
export type CreateReferenceRangeInput = z.infer<typeof createReferenceRangeSchema>;
export type UpdateReferenceRangeDetailInput = z.infer<typeof updateReferenceRangeDetailSchema>;
export type LabActivityStatsQuery = z.infer<typeof labActivityStatsQuerySchema>;
