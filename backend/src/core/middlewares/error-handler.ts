import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error';
import { sendError } from '../http/response-envelope';
import { logger } from '../logger/logger';

export const errorHandler = (err: unknown, request: Request, res: Response, next: NextFunction) => {
  void request;
  void next;
  const errorObj = err as { code?: string; name?: string; message?: string; details?: unknown; status?: number };
  logger.error({ code: errorObj.code, name: errorObj.name, message: errorObj.message }, '[Error]');

  // Prisma unique constraint violation
  if (errorObj.code === 'P2002') {
    return sendError(res, 409, 'CONFLICT_ERROR', 'Dữ liệu đã tồn tại trong hệ thống');
  }

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', details);
  }

  if (err instanceof AppError) {
    return sendError(res, err.status, err.code, err.message, err.details);
  }

  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Lỗi hệ thống không mong muốn');
};
