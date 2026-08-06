import type { BioChemistryResult } from '../types/lab-test.types';
import { getDecimalFieldErrors, type DecimalRule } from './numeric-validation';

const BIO_CHEMISTRY_PRECISION: Record<string, [number, number]> = {
  ure: [5, 2],
  glucose: [5, 2],
  creatinin: [6, 2],
  acidUric: [6, 2],
  bilirubinTP: [5, 2],
  bilirubinTT: [5, 2],
  bilirubinGT: [5, 2],
  proteinTP: [5, 2],
  albumin: [5, 2],
  globulin: [5, 2],
  tyLeAG: [4, 2],
  fibrinogen: [5, 2],
  cholesterol: [5, 2],
  triglycerid: [5, 2],
  hdlCho: [5, 2],
  ldlCho: [5, 2],
  natri: [6, 2],
  kali: [5, 2],
  clorua: [6, 2],
  calci: [5, 2],
  calciIon: [5, 2],
  phospho: [5, 2],
  sat: [6, 2],
  magie: [5, 2],
  ast: [7, 2],
  alt: [7, 2],
  amylase: [8, 2],
  ck: [7, 2],
  ckMb: [7, 2],
  ldh: [7, 2],
  ggt: [7, 2],
  cholinesterase: [9, 2],
  phosphataseKiem: [8, 2],
  phDongMach: [4, 3],
  pco2: [5, 2],
  po2DongMach: [6, 2],
  hco3Chuan: [5, 2],
  kiemDu: [5, 2],
};

/** Rule hóa sinh với precision/scale theo field; pH động mạch bị giới hạn trong 0–14. */
export const BIO_CHEMISTRY_RULES: Record<string, DecimalRule> = Object.fromEntries(
  Object.entries(BIO_CHEMISTRY_PRECISION).map(([field, [precision, scale]]) => [
    field,
    {
      label: field === 'phDongMach' ? 'pH động mạch' : field,
      min: 0,
      precision,
      scale,
      ...(field === 'phDongMach' ? { max: 14 } : {}),
    },
  ]),
);

/** Kiểm tra số Hoá sinh máu theo baseline vật lý và giới hạn pH 0–14. */
export function getBioChemistryFieldErrors(value: BioChemistryResult): Record<string, string> {
  return getDecimalFieldErrors(value as Record<string, unknown>, BIO_CHEMISTRY_RULES);
}
