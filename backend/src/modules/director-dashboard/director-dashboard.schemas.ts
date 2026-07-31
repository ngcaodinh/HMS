import type { NextFunction, Request, Response } from 'express';
import { z, ZodError } from 'zod';

import { AppError } from '../../core/errors/app-error';
import { getVietnamLegalDateString } from '../../core/time/vietnamClock';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Kiểm tra ngày lịch thật để Director API không nhận các chuỗi như 2026-99-99.
 */
function isRealDateOnly(value: string) {
  if (!datePattern.test(value)) return false;

  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
  );
}

export const directorDashboardQuerySchema = z.object({
  date: z
    .string()
    .trim()
    .refine(isRealDateOnly, 'date phải có định dạng YYYY-MM-DD hợp lệ')
    .optional(),
  period: z.enum(['today', 'week', 'month']).default('today'),
}).transform((query) => ({
  date: query.date ?? getVietnamLegalDateString(),
  period: query.period,
}));

export type ParsedDirectorDashboardQuery = z.infer<typeof directorDashboardQuerySchema>;

/**
 * Validate query riêng cho Director Dashboard để giữ đúng contract 422 VALIDATION_ERROR.
 */
export function validateDirectorDashboardQuery(req: Request, _res: Response, next: NextFunction) {
  try {
    req.query = directorDashboardQuerySchema.parse(req.query) as unknown as typeof req.query;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      next(AppError.unprocessable(
        'VALIDATION_ERROR',
        'Dữ liệu đầu vào không hợp lệ.',
        error.issues.map((issue) => ({
          field: issue.path.join('.') || 'query',
          rule: issue.message,
        })),
      ));
      return;
    }

    next(error);
  }
}
