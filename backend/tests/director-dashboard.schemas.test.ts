import { describe, expect, it } from 'vitest';

import { directorDashboardQuerySchema } from '../src/modules/director-dashboard/director-dashboard.schemas';

describe('directorDashboardQuerySchema', () => {
  it('defaults period and date for director dashboard reads', () => {
    const result = directorDashboardQuerySchema.parse({});

    expect(result.period).toBe('today');
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('rejects malformed date and unsupported period values', () => {
    expect(directorDashboardQuerySchema.safeParse({ date: '2026-99-99' }).success).toBe(false);
    expect(directorDashboardQuerySchema.safeParse({ period: 'year' }).success).toBe(false);
  });
});
