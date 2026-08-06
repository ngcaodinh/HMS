/** Bảo vệ dashboard tổng hợp: dữ liệu phải được redaction và không lộ định danh người bệnh. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { join } from 'node:path';

import {
  createDirectorEnvelopeSchema,
  directorOverviewSchema,
} from '../src/modules/dashboard/types/director-dashboard.schema';

describe('director dashboard schemas', () => {
  it('parses a redacted overview envelope', () => {
    const payload = {
      data: {
        date: '2026-07-26',
        departmentRows: [],
        hourlyFlow: [],
        kpis: [
          {
            label: 'Lượt khám & tiếp đón',
            tone: 'blue',
            value: '0',
          },
        ],
        period: 'today',
        queueMetrics: [],
        queueServedRate: 0,
      },
      meta: {
        occurredAt: '2026-07-26T21:00:00+07:00',
        requestId: 'req-test',
      },
    };

    const result = createDirectorEnvelopeSchema(directorOverviewSchema).parse(payload);

    assert.equal(result.data.period, 'today');
    assert.equal(result.meta?.occurredAt, '2026-07-26T21:00:00+07:00');
  });

  it('rejects contract drift that exposes patient identifiers', () => {
    const payload = {
      date: '2026-07-26',
      departmentRows: [],
      hourlyFlow: [],
      kpis: [],
      patientId: 'patient-1',
      period: 'today',
      queueMetrics: [],
      queueServedRate: 0,
    };

    assert.equal(directorOverviewSchema.safeParse(payload).success, false);
  });

  it('does not keep the old prominent mock literals in the dashboard page', () => {
    const file = readFileSync(
      join(process.cwd(), 'src/modules/dashboard/pages/director-dashboard/director-dashboard.tsx'),
      'utf8',
    );

    for (const literal of ['1,248', '320,5M', '87.5%', '1,284']) {
      assert.equal(file.includes(literal), false);
    }
  });
});
