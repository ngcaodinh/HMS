import type { NextFunction, Request, Response } from 'express';

import { config } from '../config/unifiedConfig';
import { AppError } from '../core/errors/appError';

export type AuthPrincipal = {
  userId: string;
  roleCodes: string[];
  permissions: string[];
  authVersion: number;
};

declare global {
  namespace Express {
    interface Request {
      principal?: AuthPrincipal;
    }
  }
}

/**
 * Sprint 1 stub auth:
 * - Có Bearer → principal receptionist dev.
 * - Development/test không Bearer → vẫn cho principal dev để wire UI.
 */
export function attachDevPrincipal(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.header('authorization');

  if (authHeader?.startsWith('Bearer ') || config.app.env === 'development' || config.app.env === 'test') {
    req.principal = {
      userId: '11111111-1111-4111-8111-111111111111',
      roleCodes: ['receptionist'],
      permissions: ['queue.read', 'queue.call', 'queue.manage', 'reception.create'],
      authVersion: 1,
    };
  }

  next();
}

/**
 * Kiểm tra permission trên request đã attach principal.
 */
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.principal) {
      next(new AppError(401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập'));
      return;
    }

    if (!req.principal.permissions.includes(permission)) {
      next(new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này'));
      return;
    }

    next();
  };
}
