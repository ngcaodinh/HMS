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

  it('covers every CBC numeric field for blank, valid, negative and malformed values', () => {
    const fields = [
      'wbc', 'neu', 'lym', 'mono', 'eos', 'baso', 'rbc', 'hgb', 'hct', 'mcv', 'mch',
      'mchc', 'rdw', 'plt', 'mpv', 'pdw', 'pct',
    ];
    for (const field of fields) {
      expect(cbcResultSchema.safeParse({ [field]: '' }).success).toBe(true);
      expect(cbcResultSchema.safeParse({ [field]: '1' }).success).toBe(true);
      expect(cbcResultSchema.safeParse({ [field]: '-1' }).success).toBe(false);
      expect(cbcResultSchema.safeParse({ [field]: 'not-a-number' }).success).toBe(false);
    }
    expect(cbcResultSchema.safeParse({ hct: '1.01' }).success).toBe(false);
    expect(cbcResultSchema.safeParse({ neu: '101' }).success).toBe(false);
  });

  it('rejects blood-gas pH outside 0-14 and urine values outside physical bounds', () => {
    expect(bioChemistryResultSchema.safeParse({ phDongMach: '15' }).success).toBe(false);
    expect(urinalysisResultSchema.safeParse({ ph: '-1' }).success).toBe(false);
    expect(urinalysisResultSchema.safeParse({ tyTrong: '1.07' }).success).toBe(false);
  });

  it('covers every biochemistry numeric field for blank, valid, negative and precision values', () => {
    const fields = [
      'ure', 'glucose', 'creatinin', 'acidUric', 'bilirubinTP', 'bilirubinTT', 'bilirubinGT',
      'proteinTP', 'albumin', 'globulin', 'tyLeAG', 'fibrinogen', 'cholesterol', 'triglycerid',
      'hdlCho', 'ldlCho', 'natri', 'kali', 'clorua', 'calci', 'calciIon', 'phospho', 'sat',
      'magie', 'ast', 'alt', 'amylase', 'ck', 'ckMb', 'ldh', 'ggt', 'cholinesterase',
      'phosphataseKiem', 'phDongMach', 'pco2', 'po2DongMach', 'hco3Chuan', 'kiemDu',
    ];
    for (const field of fields) {
      expect(bioChemistryResultSchema.safeParse({ [field]: '' }).success).toBe(true);
      expect(bioChemistryResultSchema.safeParse({ [field]: '1' }).success).toBe(true);
      expect(bioChemistryResultSchema.safeParse({ [field]: '-1' }).success).toBe(false);
      expect(bioChemistryResultSchema.safeParse({ [field]: '1.123456789' }).success).toBe(false);
    }
  });

  it('covers every urine numeric field and physical bounds', () => {
    const fields = [
      'ph', 'tyTrong', 'nt24TheTich', 'nt24Protein', 'nt24Glucose', 'nt24Ure', 'nt24Creatinin',
      'nt24AcidUric', 'nt24Amylase', 'nt24Na', 'nt24K', 'dntProtein', 'dntGlucose', 'dntClorua',
      'dichViHClTuDo', 'dichViHClToanPhan', 'dcdProtein',
    ];
    for (const field of fields) {
      expect(urinalysisResultSchema.safeParse({ [field]: '' }).success).toBe(true);
      expect(urinalysisResultSchema.safeParse({ [field]: field === 'tyTrong' ? '1.01' : '1' }).success).toBe(true);
      expect(urinalysisResultSchema.safeParse({ [field]: '-1' }).success).toBe(false);
    }
    expect(urinalysisResultSchema.safeParse({ ph: '15' }).success).toBe(false);
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

  it('covers all custom antibiogram slots and allows a conclusion without antibiogram data', () => {
    for (const field of ['ksdKhacKqA', 'ksdKhacKqB', 'ksdKhacKqC']) {
      const invalid = recordLabResultSchema.safeParse({
        ...signature,
        conclusion: 'Có kết quả.',
        resultTableKey: 'xn_vi_sinh',
        structuredResult: { [field]: 'R' },
      });
      expect(invalid.success).toBe(false);
    }
    expect(recordLabResultSchema.safeParse({
      ...signature,
      conclusion: 'Không phát hiện bất thường.',
      resultTableKey: 'xn_vi_sinh',
      structuredResult: {},
    }).success).toBe(true);
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
