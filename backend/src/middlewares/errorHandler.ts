import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../core/errors/appError';
import { AppError as HttpStatusAppError } from '../core/errors/app-error';
import { sendError } from '../core/http/response';
import { logger } from '../core/logger/logger';

/**
 * Error-handling middleware Express (cuối chuỗi).
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Express nhận diện error middleware qua đủ bốn tham số; nhánh này luôn tự trả response.
  void next;
  const requestId = req.requestId;

  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message, error.details, requestId);
    return;
  }

  if (error instanceof HttpStatusAppError) {
    sendError(res, error.httpStatus, error.code, error.message, error.details, requestId);
    return;
  }

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      rule: issue.message,
      message: issue.message,
    }));
    const message =
      details.length === 1
        ? (details[0]?.message ?? 'Dữ liệu đầu vào không hợp lệ')
        : 'Dữ liệu đầu vào không hợp lệ';

    sendError(res, 400, 'VALIDATION_ERROR', message, details, requestId);
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
