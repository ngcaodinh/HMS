import type { Response } from 'express';
import { randomUUID } from 'node:crypto';

import { getVietnamNowIso } from '../time/vietnamClock';

type SuccessOptions = {
  meta?: Record<string, unknown>;
  status?: number;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
};

/**
 * Trả response thành công theo Shared Contract v1, hỗ trợ cả signature cũ và mới.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusOrOptions: number | SuccessOptions = 200,
  requestId?: string,
) {
  const options =
    typeof statusOrOptions === 'number'
      ? { status: statusOrOptions, meta: { requestId } }
      : statusOrOptions;

  return res.status(options.status ?? 200).json({
    data,
    meta: {
      requestId: (options.meta?.requestId as string | undefined) ?? randomUUID(),
      occurredAt: getVietnamNowIso(),
      ...options.meta,
    },
  });
}

/**
 * Trả response danh sách có phân trang cho các endpoint dạng list.
 */
export function sendPaginated<T>(res: Response, data: T[], pagination: Pagination) {
  const totalPages = Math.max(1, Math.ceil(pagination.totalItems / pagination.pageSize));

  return res.status(200).json({
    data,
    pagination: {
      ...pagination,
      totalPages,
    },
  });
}

/**
 * Trả response lỗi theo Shared Contract v1.
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Array<{ field: string; rule: string; message?: string }>,
  requestId?: string,
) {
  return res.status(statusCode).json({
    error: {
      code,
      details: details ?? [],
      message,
      requestId: requestId ?? randomUUID(),
    },
  });
}
