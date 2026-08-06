import type { UrinalysisResult } from '../types/lab-test.types';
import { getDecimalFieldErrors, type DecimalRule } from './numeric-validation';

const URINALYSIS_PRECISION: Record<string, [number, number]> = {
  nt24TheTich: [5, 2],
  nt24Protein: [7, 4],
  nt24Glucose: [7, 3],
  nt24Ure: [7, 2],
  nt24Creatinin: [7, 3],
  nt24AcidUric: [7, 3],
  nt24Amylase: [8, 2],
  nt24Na: [7, 2],
  nt24K: [7, 2],
  dntProtein: [6, 3],
  dntGlucose: [5, 2],
  dntClorua: [6, 2],
  dichViHClTuDo: [5, 2],
  dichViHClToanPhan: [5, 2],
  dcdProtein: [6, 2],
};

/** Rule nước tiểu và dịch: pH 0–14, tỷ trọng 1–1,06, trường số khác không âm. */
export const URINALYSIS_RULES: Record<string, DecimalRule> = {
  ph: { label: 'pH', max: 14, min: 0, precision: 3, scale: 1 },
  tyTrong: { label: 'Tỷ trọng', max: 1.06, min: 1, precision: 5, scale: 3 },
  ...Object.fromEntries(
    Object.entries(URINALYSIS_PRECISION).map(([field, [precision, scale]]) => [
      field,
      {
        label: field,
        min: 0,
        precision,
        scale,
      },
    ]),
  ),
};

/** Kiểm tra các trường số của nước tiểu, DNT, dịch vị và dịch chọc dò. */
export function getUrinalysisFieldErrors(value: UrinalysisResult): Record<string, string> {
  return getDecimalFieldErrors(value as Record<string, unknown>, URINALYSIS_RULES);
}
