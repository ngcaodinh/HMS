import * as Sentry from '@sentry/node';
import type { Response } from 'express';
import { ZodError } from 'zod';

import { AppError, isAppError, mapErrorDetailsToFields } from './app-error';

/**
 * Chuẩn hóa success/error envelope cho các controller Express trong HMS.
 */
export class BaseController {
  /**
   * Trả dữ liệu thành công kèm requestId để client và log cùng đối chiếu.
   */
  protected handleSuccess<T>(res: Response, data: T, status = 200) {
    const requestId = res.locals.requestId as string;

    res.status(status).json({
      data,
      meta: {
        requestId,
      },
    });
  }

  /**
   * Chuyển lỗi sang response công khai và gửi lỗi 5xx lên Sentry.
   */
  protected handleError(res: Response, error: unknown) {
    const appError = this.normalizeError(error);
    const requestId = res.locals.requestId as string;

    if (appError.status >= 500) {
      Sentry.captureException(error);
    }

    res.status(appError.status).json({
      error: {
        code: appError.code,
        details: appError.details,
        fields: mapErrorDetailsToFields(appError.details),
        message: appError.message,
        requestId,
      },
    });
  }

  /**
   * Map lỗi validation và lỗi không xác định thành AppError ổn định.
   */
  private normalizeError(error: unknown) {
    if (isAppError(error)) return error;

    if (error instanceof ZodError) {
      return new AppError({
        code: 'VALIDATION_ERROR',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.') || undefined,
          message: issue.message,
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
