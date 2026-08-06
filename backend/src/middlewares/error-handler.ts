import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

import { AppError } from '../core/errors/app-error';
import { sendError } from '../core/http/response';
import { logger } from '../core/logger/logger';

const UNIQUE_FIELD_MESSAGES: Record<string, string> = {
  identityCardNumber: 'Số CCCD đã tồn tại trên hệ thống',
  specimenCode: 'Mã mẫu bệnh phẩm đã tồn tại trên hệ thống',
  date: 'Ngày và số thứ tự hàng đợi đã tồn tại trên hệ thống',
  number: 'Ngày và số thứ tự hàng đợi đã tồn tại trên hệ thống',
};

/** Lấy danh sách field bị trùng từ metadata Prisma mà không đưa metadata nội bộ ra response. */
function getUniqueFields(error: Prisma.PrismaClientKnownRequestError): string[] {
  const target = error.meta?.target;
  const fields = Array.isArray(target)
    ? target.filter((field): field is string => typeof field === 'string')
    : typeof target === 'string'
      ? [target]
      : [];

  // Chỉ đưa ra các field đã có message nghiệp vụ; không làm lộ tên cột nội bộ từ Prisma.
  return fields.filter((field) => field in UNIQUE_FIELD_MESSAGES);
}

/** Chọn message conflict an toàn theo field, fallback cho constraint chưa có mapping riêng. */
function getUniqueConstraintMessage(fields: string[]): string {
  const mappedMessage = fields.map((field) => UNIQUE_FIELD_MESSAGES[field]).find(Boolean);
  return mappedMessage ?? 'Dữ liệu đã tồn tại trên hệ thống';
}

/**
 * Chuẩn hóa lỗi cuối chuỗi Express thành response an toàn và ổn định.
 * Không trả metadata Prisma hoặc stack trace về client.
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

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const fields = getUniqueFields(error);
    const message = getUniqueConstraintMessage(fields);
    const details = fields.map((field) => ({ field, rule: 'unique', message }));
    sendError(res, 409, 'CONFLICT_ERROR', message, details, requestId);
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
