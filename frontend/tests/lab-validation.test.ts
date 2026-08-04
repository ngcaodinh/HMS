import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  BIO_CHEMISTRY_RULES,
  getBioChemistryFieldErrors,
} from '../src/modules/lab/validation/bio-chemistry-validation';
import { CBC_RULES, getCbcFieldErrors } from '../src/modules/lab/validation/cbc-validation';
import { getMicrobiologyFieldErrors } from '../src/modules/lab/validation/microbiology-validation';
import { getPathologyFieldErrors } from '../src/modules/lab/validation/pathology-validation';
import { ANTIBIOGRAM_FIELDS } from '../src/modules/lab/types/lab-test.types';
import {
  getUrinalysisFieldErrors,
  URINALYSIS_RULES,
} from '../src/modules/lab/validation/urinalysis-validation';
import { getReferenceRangeFormErrors } from '../src/modules/lab/validation/reference-range-validation';

describe('lab result validation helpers', () => {
  it('rejects negative CBC values but allows an abnormal positive WBC', () => {
    assert.equal(getCbcFieldErrors({ wbc: '-1' }).wbc, 'WBC phải lớn hơn hoặc bằng 0.');
    assert.deepEqual(getCbcFieldErrors({ wbc: '25' }), {});
    assert.deepEqual(getCbcFieldErrors({ wbc: '' }), {});
  });

  it('covers blank, valid, negative, maximum and precision cases for every CBC numeric field', () => {
    for (const [field, rule] of Object.entries(CBC_RULES)) {
      assert.deepEqual(getCbcFieldErrors({ [field]: '' }), {});
      assert.deepEqual(getCbcFieldErrors({ [field]: String(rule.min) }), {});
      assert.ok(getCbcFieldErrors({ [field]: String(rule.min - 1) })[field]);
      if (rule.max !== undefined) {
        assert.deepEqual(getCbcFieldErrors({ [field]: String(rule.max) }), {});
        assert.ok(getCbcFieldErrors({ [field]: String(rule.max + 1) })[field]);
      }
      assert.ok(getCbcFieldErrors({ [field]: `1.${'1'.repeat(rule.scale + 1)}` })[field]);
    }
  });

  it('enforces blood-gas pH bounds while allowing a valid non-clinical reference value', () => {
    assert.equal(
      getBioChemistryFieldErrors({ phDongMach: '15' }).phDongMach,
      'pH động mạch phải nhỏ hơn hoặc bằng 14.',
    );
    assert.deepEqual(getBioChemistryFieldErrors({ ure: '25' }), {});
    assert.deepEqual(getBioChemistryFieldErrors({ ure: '' }), {});
  });

  it('covers blank, valid, negative, maximum and precision cases for every biochemistry field', () => {
    for (const [field, rule] of Object.entries(BIO_CHEMISTRY_RULES)) {
      assert.deepEqual(getBioChemistryFieldErrors({ [field]: '' }), {});
      assert.deepEqual(getBioChemistryFieldErrors({ [field]: String(rule.min) }), {});
      assert.ok(getBioChemistryFieldErrors({ [field]: String(rule.min - 1) })[field]);
      if (rule.max !== undefined) {
        assert.deepEqual(getBioChemistryFieldErrors({ [field]: String(rule.max) }), {});
        assert.ok(getBioChemistryFieldErrors({ [field]: String(rule.max + 1) })[field]);
      }
      assert.ok(getBioChemistryFieldErrors({ [field]: `1.${'1'.repeat(rule.scale + 1)}` })[field]);
    }
  });

  it('validates urine pH and specific gravity without blocking valid values', () => {
    assert.equal(getUrinalysisFieldErrors({ ph: '-0.1' }).ph, 'pH phải lớn hơn hoặc bằng 0.');
    assert.equal(
      getUrinalysisFieldErrors({ tyTrong: '1.07' }).tyTrong,
      'Tỷ trọng phải nhỏ hơn hoặc bằng 1.06.',
    );
    assert.deepEqual(getUrinalysisFieldErrors({ tyTrong: '1.05' }), {});
  });

  it('covers blank, valid, negative, maximum and precision cases for every urinalysis numeric field', () => {
    for (const [field, rule] of Object.entries(URINALYSIS_RULES)) {
      assert.deepEqual(getUrinalysisFieldErrors({ [field]: '' }), {});
      assert.deepEqual(getUrinalysisFieldErrors({ [field]: String(rule.min) }), {});
      assert.ok(getUrinalysisFieldErrors({ [field]: String(rule.min - 1) })[field]);
      if (rule.max !== undefined) {
        assert.deepEqual(getUrinalysisFieldErrors({ [field]: String(rule.max) }), {});
        assert.ok(getUrinalysisFieldErrors({ [field]: String(rule.max + 1) })[field]);
      }
      assert.ok(getUrinalysisFieldErrors({ [field]: `1.${'1'.repeat(rule.scale + 1)}` })[field]);
    }
  });

  it('requires a microorganism when an antibiogram result is entered', () => {
    assert.equal(
      getMicrobiologyFieldErrors({ ksdPenicilline: 'S' }).chungVkKsd,
      'Cần nhập chủng vi khuẩn khi đã có kết quả kháng sinh đồ.',
    );
    assert.deepEqual(
      getMicrobiologyFieldErrors({ ksdPenicilline: 'S', chungVkKsd: 'E. coli' }),
      {},
    );
  });

  it('covers every fixed and custom antibiogram result field', () => {
    for (const field of [
      ...ANTIBIOGRAM_FIELDS,
      'ksdKhacKqA',
      'ksdKhacKqB',
      'ksdKhacKqC',
    ] as const) {
      assert.ok(getMicrobiologyFieldErrors({ [field]: 'S' }).chungVkKsd);
      assert.deepEqual(getMicrobiologyFieldErrors({ [field]: 'S', chungVkKsd: 'E. coli' }), {});
    }
    assert.deepEqual(getMicrobiologyFieldErrors({}), {});
  });

  it('validates pathology identifiers and positive specimen counts', () => {
    const errors = getPathologyFieldErrors({
      bacSiGiaiPhauBenh: 'not-a-uuid',
      chanDoanMoHoc: 'Carcinoma',
      icd10MoHoc: 'bad-code',
      soManh: 0,
      trangThai: 'da_co_ket_qua',
    });

    assert.equal(errors.icd10MoHoc, 'Mã ICD-10 không đúng định dạng, VD: L23.9.');
    assert.equal(errors.bacSiGiaiPhauBenh, 'Mã người dùng không đúng định dạng UUID.');
    assert.equal(errors.soManh, 'Số mảnh phải là số nguyên dương.');
  });

  it('covers every pathology UUID/date/final-required rule', () => {
    for (const field of ['bacSiGiaiPhauBenh', 'nguoiPhaBenhPham', 'nguoiLamTieuBan'] as const) {
      assert.ok(getPathologyFieldErrors({ [field]: 'invalid', trangThai: 'cho_ket_qua' })[field]);
    }
    for (const field of ['thoiGianCoDinh', 'ngayPha', 'ngayLamTieuBan', 'ngayTraKetQua'] as const) {
      assert.ok(getPathologyFieldErrors({ [field]: 'invalid', trangThai: 'cho_ket_qua' })[field]);
    }
    const requiredErrors = getPathologyFieldErrors({ trangThai: 'da_co_ket_qua' });
    assert.ok(requiredErrors.chanDoanMoHoc);
    assert.ok(requiredErrors.bacSiGiaiPhauBenh);
    assert.ok(requiredErrors.ngayTraKetQua);
  });

  it('requires valid reference-range bounds and a safe code format', () => {
    const errors = getReferenceRangeFormErrors({
      code: 'HSM/1',
      fieldKey: 'ure',
      label: 'Urê',
      labTestTypeId: 'type-1',
      lowerBound: '5',
      upperBound: '3',
    });

    assert.equal(errors.code, 'Mã chỉ được chứa chữ, số và dấu gạch ngang.');
    assert.equal(errors.upperBound, 'Ngưỡng trên phải lớn hơn ngưỡng dưới.');
  });
});
