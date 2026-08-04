import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getBioChemistryFieldErrors } from '../src/modules/lab/validation/bio-chemistry-validation';
import { getCbcFieldErrors } from '../src/modules/lab/validation/cbc-validation';
import { getMicrobiologyFieldErrors } from '../src/modules/lab/validation/microbiology-validation';
import { getPathologyFieldErrors } from '../src/modules/lab/validation/pathology-validation';
import { getUrinalysisFieldErrors } from '../src/modules/lab/validation/urinalysis-validation';
import { getReferenceRangeFormErrors } from '../src/modules/lab/validation/reference-range-validation';

describe('lab result validation helpers', () => {
  it('rejects negative CBC values but allows an abnormal positive WBC', () => {
    assert.equal(getCbcFieldErrors({ wbc: '-1' }).wbc, 'WBC phải lớn hơn hoặc bằng 0.');
    assert.deepEqual(getCbcFieldErrors({ wbc: '25' }), {});
    assert.deepEqual(getCbcFieldErrors({ wbc: '' }), {});
  });

  it('enforces blood-gas pH bounds while allowing a valid non-clinical reference value', () => {
    assert.equal(
      getBioChemistryFieldErrors({ phDongMach: '15' }).phDongMach,
      'pH động mạch phải nhỏ hơn hoặc bằng 14.',
    );
    assert.deepEqual(getBioChemistryFieldErrors({ ure: '25' }), {});
    assert.deepEqual(getBioChemistryFieldErrors({ ure: '' }), {});
  });

  it('validates urine pH and specific gravity without blocking valid values', () => {
    assert.equal(getUrinalysisFieldErrors({ ph: '-0.1' }).ph, 'pH phải lớn hơn hoặc bằng 0.');
    assert.equal(
      getUrinalysisFieldErrors({ tyTrong: '1.07' }).tyTrong,
      'Tỷ trọng phải nhỏ hơn hoặc bằng 1.06.',
    );
    assert.deepEqual(getUrinalysisFieldErrors({ tyTrong: '1.05' }), {});
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
