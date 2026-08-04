import { describe, expect, it } from 'vitest';

import {
  bioChemistryResultSchema,
  cbcResultSchema,
  createReferenceRangeSchema,
  recordLabResultSchema,
  urinalysisResultSchema,
} from '../src/modules/lab-tests/schemas/lab-test.schemas';

const signature = {
  attachmentId: 'attachment-1',
  signatureConfirmation: true as const,
  signatureMethod: 'dev_e_confirmation' as const,
};

describe('lab result schemas', () => {
  it('rejects negative CBC values and accepts an abnormal positive WBC', () => {
    expect(cbcResultSchema.safeParse({ wbc: '-1' }).success).toBe(false);
    expect(cbcResultSchema.safeParse({ wbc: '25' }).success).toBe(true);
    expect(cbcResultSchema.safeParse({}).success).toBe(true);
  });

  it('rejects blood-gas pH outside 0-14 and urine values outside physical bounds', () => {
    expect(bioChemistryResultSchema.safeParse({ phDongMach: '15' }).success).toBe(false);
    expect(urinalysisResultSchema.safeParse({ ph: '-1' }).success).toBe(false);
    expect(urinalysisResultSchema.safeParse({ tyTrong: '1.07' }).success).toBe(false);
  });

  it('requires a conclusion and microorganism when microbiology has an antibiogram result', () => {
    const invalid = recordLabResultSchema.safeParse({
      ...signature,
      resultTableKey: 'xn_vi_sinh',
      structuredResult: { ksdPenicilline: 'S' },
    });
    const valid = recordLabResultSchema.safeParse({
      ...signature,
      conclusion: 'Phát hiện vi khuẩn.',
      resultTableKey: 'xn_vi_sinh',
      structuredResult: { chungVkKsd: 'E. coli', ksdPenicilline: 'S' },
    });

    expect(invalid.success).toBe(false);
    expect(valid.success).toBe(true);
  });

  it('validates pathology ICD-10/user UUID and report code format', () => {
    const result = recordLabResultSchema.safeParse({
      ...signature,
      reportCode: 'bad code',
      resultTableKey: 'xn_mo_benh_hoc',
      structuredResult: {
        bacSiGiaiPhauBenh: 'not-a-uuid',
        chanDoanMoHoc: 'Carcinoma',
        icd10MoHoc: 'bad-code',
        ngayTraKetQua: '2026-08-04',
        trangThai: 'da_co_ket_qua',
      },
    });

    expect(result.success).toBe(false);
  });

  it('requires reference lower bound to be lower than upper bound', () => {
    const result = createReferenceRangeSchema.safeParse({
      code: 'HSM-001',
      fieldKey: 'ure',
      label: 'Ure',
      labTestTypeId: 'type-1',
      lowerBound: '10',
      upperBound: '2',
    });

    expect(result.success).toBe(false);
  });
});
