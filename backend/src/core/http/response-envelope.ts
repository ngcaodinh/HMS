import type { Response } from 'express';
import { toVNISOString } from '../utils/datetime';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>
) {
  const requestId = (res.req as { id?: string; headers?: Record<string, string> })?.id || (res.req as { headers?: Record<string, string> })?.headers?.['x-request-id'] || 'req-dev';
  return res.status(statusCode).json({
    data,
    meta: {
      requestId,
      occurredAt: toVNISOString(new Date()),
      ...meta,
    },
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
) {
  const requestId = (res.req as { id?: string; headers?: Record<string, string> })?.id || (res.req as { headers?: Record<string, string> })?.headers?.['x-request-id'] || 'req-dev';
  return res.status(statusCode).json({
    error: {
      code,
      message,
      details: details ?? null,
      requestId,
    },
  });
}
