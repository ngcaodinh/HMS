import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  extractApiData,
  extractApiListData,
  type SpecimenDto,
} from '../src/modules/nurse/hooks/useLane6';

describe('nurse lane 6 API response helpers', () => {
  it('unwraps backend envelopes so specimens and orders stay filterable arrays', () => {
    const specimens: SpecimenDto[] = [
      {
        barcodePrinted: false,
        collectedAt: null,
        collectedBy: null,
        createdAt: '2026-07-26T00:00:00.000Z',
        departmentName: 'Khoa Nội trú',
        handedOverAt: null,
        handedOverBy: null,
        id: 'spec-1',
        labReceiverName: null,
        orderDescription: 'CBC',
        patientCode: 'BN001',
        patientName: 'Nguyen Van A',
        priority: false,
        recordId: 'record-1',
        specimenCode: 'DL-001',
        specimenType: 'blood',
        status: 'pending',
        updatedAt: '2026-07-26T00:00:00.000Z',
      },
    ];

    const orders = [
      {
        orderType: 'care',
        patientName: 'Nguyen Van A',
        status: 'active',
        treatmentOrderId: 'order-1',
      },
    ];

    assert.deepEqual(extractApiListData({ data: specimens, meta: { requestId: 'req-1' } }), specimens);
    assert.equal(extractApiListData(specimens), specimens);
    assert.deepEqual(extractApiListData({ data: { items: orders } }), orders);
  });

  it('unwraps vitals queue envelopes without losing worklist or stats', () => {
    const vitalsQueue = {
      stats: {
        allergyAlertTodayCount: 0,
        avgMinutesPerPatient: 0,
        measuredTodayCount: 3,
        measuredTodayDelta: 1,
        waitingCount: 7,
      },
      ticketQueue: {
        currentCalled: null,
        waitingCount: 4,
        waitingNumbers: [1, 2, 3, 4],
      },
      worklist: [
        {
          age: 42,
          allergies: null,
          createdAt: '2026-07-26T00:00:00.000Z',
          diagnosis: 'Viêm da',
          gender: 'Nam',
          patientName: 'Nguyen Van A',
          recordCode: 'BA001',
          recordId: 'record-1',
          version: 1,
        },
      ],
    };

    assert.deepEqual(extractApiData({ data: vitalsQueue }), vitalsQueue);
    assert.equal(extractApiData(vitalsQueue).worklist.length, 1);
  });
});
