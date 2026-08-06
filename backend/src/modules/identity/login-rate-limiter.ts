import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../core/http/app-error';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

/**
 * Xóa bộ đếm rate limit để unit test không phụ thuộc trạng thái test trước đó.
 * Không dùng trong runtime production và không trả dữ liệu nghiệp vụ.
 */
export const resetLoginRateLimiterForTests = () => {
  attempts.clear();
};

/**
 * Tạo khóa rate limit từ IP và username đã chuẩn hóa.
 * Nhận request đăng nhập, trả chuỗi định danh để gom các lần thử của cùng một nguồn.
 */
const getAttemptKey = (req: Request) => {
  const body = req.body as { username?: unknown };
  const username = typeof body.username === 'string' ? body.username : 'unknown';

  return `${req.ip}:${username.trim().toLowerCase()}`;
};

/**
 * Ghi nhận một lần đăng nhập thất bại trong cửa sổ hiện tại.
 * Nhận khóa rate limit và thời điểm hiện tại, cập nhật bộ đếm in-memory cho middleware.
 */
const recordFailedAttempt = (key: string, now: number) => {
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return;
  }

  current.count += 1;
};

/**
 * Giới hạn thử đăng nhập theo IP + username và chỉ tính các phản hồi 401.
 * Nhận request đăng nhập, gắn listener vào response để cập nhật bộ đếm sau khi biết kết quả.
 */
export const loginRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const key = getAttemptKey(req);
  const now = Date.now();
  const current = attempts.get(key);

  if (current && current.resetAt <= now) {
    attempts.delete(key);
  }

  const activeAttempt = attempts.get(key);

  if (activeAttempt && activeAttempt.count >= MAX_ATTEMPTS) {
    res.setHeader('Retry-After', Math.ceil((activeAttempt.resetAt - now) / 1000));
    next(
      new AppError({
        code: 'LOGIN_RATE_LIMITED',
        message: 'Đăng nhập sai quá nhiều lần, vui lòng thử lại sau',
        status: 429,
      }),
    );
    return;
  }

  res.once('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      attempts.delete(key);
      return;
    }

    if (res.statusCode === 401) {
      recordFailedAttempt(key, Date.now());
    }
  });

  next();
};
