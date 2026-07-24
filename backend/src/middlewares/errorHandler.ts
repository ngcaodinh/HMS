import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../core/errors/appError';
import { sendError } from '../core/http/response';
import { logger } from '../core/logger/logger';

/**
 * Error-handling middleware Express (cuối chuỗi).
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message, error.details, requestId);
    return;
  }

  if (error instanceof ZodError) {
    sendError(
      res,
      400,
      'VALIDATION_ERROR',
      'Dữ liệu đầu vào không hợp lệ',
      error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        rule: issue.code,
      })),
      requestId,
    );
    return;
  }

  logger.error({ error, requestId }, 'Unhandled error');
  sendError(
    res,
    500,
    'INTERNAL_ERROR',
    'Lỗi hệ thống. Vui lòng thử lại sau.',
    undefined,
    requestId,
  );
}
