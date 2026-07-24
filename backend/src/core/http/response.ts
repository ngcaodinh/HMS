import { randomUUID } from 'node:crypto';

import type { Response } from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { config } from '../../config/unifiedConfig';

dayjs.extend(utc);
dayjs.extend(timezone);

interface SuccessMeta {
  requestId: string;
  occurredAt: string;
  [key: string]: unknown;
}

/**
 * Sends the success envelope `{ data, meta }` mandated by
 * Tailieu/HMS-Service-Lane-Task-Breakdown.md (§Shared Contract toàn cục v1).
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  options?: { status?: number; meta?: Record<string, unknown> },
) {
  const meta: SuccessMeta = {
    requestId: randomUUID(),
    occurredAt: dayjs().tz(config.app.timezone).format('YYYY-MM-DDTHH:mm:ssZ'),
    ...options?.meta,
  };

  return res.status(options?.status ?? 200).json({ data, meta });
}

/**
 * Sends the paginated success envelope `{ data, pagination }` used by list endpoints.
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; pageSize: number; totalItems: number },
) {
  const totalPages = Math.max(1, Math.ceil(pagination.totalItems / pagination.pageSize));
  return res.status(200).json({
    data,
    pagination: { ...pagination, totalPages },
  });
}
