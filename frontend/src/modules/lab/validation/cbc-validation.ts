import type { CbcResult } from '../types/lab-test.types';
import { getDecimalFieldErrors, type DecimalRule } from './numeric-validation';

const CBC_RULES: Record<string, DecimalRule> = {
  wbc: { label: 'WBC', min: 0, precision: 6, scale: 2 },
  neu: { label: 'NEU', max: 100, min: 0, precision: 5, scale: 2 },
  lym: { label: 'LYM', max: 100, min: 0, precision: 5, scale: 2 },
  mono: { label: 'MONO', max: 100, min: 0, precision: 5, scale: 2 },
  eos: { label: 'EOS', max: 100, min: 0, precision: 5, scale: 2 },
  baso: { label: 'BASO', max: 100, min: 0, precision: 5, scale: 2 },
  rbc: { label: 'RBC', min: 0, precision: 6, scale: 2 },
  hgb: { label: 'HGB', min: 0, precision: 5, scale: 1 },
  hct: { label: 'HCT', max: 1, min: 0, precision: 5, scale: 3 },
  mcv: { label: 'MCV', min: 0, precision: 6, scale: 2 },
  mch: { label: 'MCH', min: 0, precision: 6, scale: 2 },
  mchc: { label: 'MCHC', min: 0, precision: 6, scale: 2 },
  rdw: { label: 'RDW', min: 0, precision: 5, scale: 2 },
  plt: { label: 'PLT', min: 0, precision: 6, scale: 1 },
  mpv: { label: 'MPV', min: 0, precision: 5, scale: 2 },
  pdw: { label: 'PDW', min: 0, precision: 5, scale: 2 },
  pct: { label: 'PCT', min: 0, precision: 6, scale: 4 },
};

/** Kiểm tra các chỉ số CBC theo CHECK vật lý của bảng công thức máu. */
export function getCbcFieldErrors(value: CbcResult): Record<string, string> {
  return getDecimalFieldErrors(value as Record<string, unknown>, CBC_RULES);
}
