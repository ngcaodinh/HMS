import * as Sentry from '@sentry/node';
import type { Response } from 'express';
import { ZodError } from 'zod';

import { AppError, isAppError } from './AppError';

export class BaseController {
  protected handleSuccess<T>(res: Response, data: T, status = 200) {
    res.status(status).json({
      data,
      meta: {
        requestId: res.locals.requestId,
      },
    });
  }

  protected handleError(res: Response, error: unknown) {
    const appError = this.normalizeError(error);

    if (appError.status >= 500) {
      Sentry.captureException(error);
    }

    res.status(appError.status).json({
      error: {
        code: appError.code,
        details: appError.details,
        message: appError.message,
        requestId: res.locals.requestId,
      },
    });
  }

  private normalizeError(error: unknown) {
    if (isAppError(error)) return error;

    if (error instanceof ZodError) {
      return new AppError({
        code: 'VALIDATION_ERROR',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          rule: issue.code,
        })),
        message: 'Dữ liệu đầu vào không hợp lệ',
        status: 400,
      });
    }

    return new AppError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Hệ thống tạm thời không xử lý được yêu cầu',
      status: 500,
    });
  }
}
