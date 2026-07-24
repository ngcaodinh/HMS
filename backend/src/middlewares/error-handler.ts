import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../core/errors/app-error';
import { logger } from '../core/logger/logger';

/**
 * Centralized error handler (CLAUDE.md §5.2) — controllers must call `next(error)`
 * instead of formatting error responses inline. Registered last in app.ts.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = randomUUID();

  if (err instanceof AppError) {
    logger.warn({ requestId, code: err.code, path: req.path }, err.message);
    return res.status(err.httpStatus).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
  }

  logger.error({ requestId, path: req.path, err }, 'Unhandled error');
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
      requestId,
    },
  });
}

/** Catch-all for unmatched `/api/v1/*` routes, kept consistent with the error envelope. */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Không tìm thấy route ${req.method} ${req.path}.`,
      requestId: randomUUID(),
    },
  });
}
