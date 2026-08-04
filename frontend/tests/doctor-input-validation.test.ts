import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { DoctorFeedbackModal } from '../src/modules/doctor/components/doctor-feedback-modal';
import { getFieldError, getFieldErrorMap } from '../src/modules/doctor/components/field-error';
import { visibleSteps } from '../src/modules/doctor/components/patient-header';
import { resetDraftForNoDrug } from '../src/modules/doctor/components/prescription-draft-helpers';
import { ApiError } from '../src/shared/api-client';

describe('doctor field-error binding', () => {
  it('returns the first backend rule for a field and ignores missing fields', () => {
    const fields = {
      pulse: ['Mạch phải lớn hơn 0.', 'Mạch không hợp lệ.'],
      spo2: ['SpO2 không được lớn hơn 100%.'],
    };

    assert.equal(getFieldError(fields, 'pulse'), 'Mạch phải lớn hơn 0.');
    assert.equal(getFieldError(fields, 'missing'), undefined);
    assert.deepEqual(getFieldErrorMap(new Error('network')), {});
  });

  it('maps every backend field error without replacing specific rules by a generic message', () => {
    const error = new ApiError({
      code: 'VALIDATION_ERROR',
      fields: {
        pulse: ['Mạch không hợp lệ.'],
        bloodPressureSystolic: ['Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.'],
      },
      message: 'Dữ liệu đầu vào không hợp lệ',
      status: 400,
    });

    assert.deepEqual(getFieldErrorMap(error), {
      pulse: 'Mạch không hợp lệ.',
      bloodPressureSystolic: 'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.',
    });
  });
});

describe('doctor workflow tab visibility', () => {
  it('does not expose outpatient prescription for an undecided or inpatient record', () => {
    assert.equal(
      visibleSteps(null).some((step) => step.id === 'prescription'),
      false,
    );
    assert.equal(
      visibleSteps({ treatmentType: null }).some((step) => step.id === 'prescription'),
      false,
    );
    assert.equal(
      visibleSteps({ treatmentType: 'inpatient' }).some((step) => step.id === 'prescription'),
      false,
    );
  });

  it('exposes the prescription tab only for diagnosed outpatient records', () => {
    const steps = visibleSteps({ treatmentType: 'outpatient' });

    assert.equal(steps.at(-1)?.id, 'prescription');
    assert.equal(steps.length, 5);
  });
});

describe('doctor prescription form state', () => {
  it('clears stale line errors and allergy override when switching to no-drug', () => {
    assert.deepEqual(resetDraftForNoDrug(), {
      allergyOverrideReason: null,
      lineErrors: {},
      lines: [],
    });
  });
});

describe('doctor feedback popup contract', () => {
  it('renders an accessible, styled dialog instead of a browser alert', () => {
    const markup = renderToStaticMarkup(
      createElement(DoctorFeedbackModal, {
        message: 'Hồ sơ đã được cập nhật bởi thao tác khác.',
        onClose: () => undefined,
        title: 'Không thể lưu',
        tone: 'info',
      }),
    );

    assert.match(markup, /role="dialog"/);
    assert.match(markup, /aria-modal="true"/);
    assert.match(markup, /Không thể lưu/);
    assert.match(markup, /Hồ sơ đã được cập nhật bởi thao tác khác\./);
    assert.match(markup, /bg-\[#f0f9ff\]/);
  });
});
