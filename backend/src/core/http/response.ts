import type { Response } from 'express';
import { randomUUID } from 'node:crypto';

import { getVietnamNowIso } from '../time/vietnamClock';

/**
 * Success body theo Shared Contract v1.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  requestId?: string,
): void {
  res.status(statusCode).json({
    data,
    meta: {
      requestId: requestId ?? randomUUID(),
      occurredAt: getVietnamNowIso(),
    },
  });
}

/**
 * Error body theo Shared Contract v1.
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Array<{ field: string; rule: string }>,
  requestId?: string,
): void {
  res.status(statusCode).json({
    error: {
      code,
      message,
      details: details ?? [],
      requestId: requestId ?? randomUUID(),
    },
  });
}
