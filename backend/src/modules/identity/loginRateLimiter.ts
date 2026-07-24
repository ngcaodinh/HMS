import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../core/http/AppError';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export const loginRateLimiter = (req: Request, _res: Response, next: NextFunction) => {
  const username = typeof req.body?.username === 'string' ? req.body.username : 'unknown';
  const key = `${req.ip}:${username.toLowerCase()}`;
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    next();
    return;
  }

  if (current.count >= MAX_ATTEMPTS) {
    next(
      new AppError({
        code: 'LOGIN_RATE_LIMITED',
        message: 'Đăng nhập sai quá nhiều lần, vui lòng thử lại sau',
        status: 429,
      }),
    );
    return;
  }

  current.count += 1;
  next();
};
