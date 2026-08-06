import type { NextFunction, Request, Response } from 'express';

import { config } from '../config/unified-config';
import { AppError } from '../core/errors/app-error';
import type { Principal } from '../modules/auth/types/auth.types';

export type AuthPrincipal = Principal;

/**
 * Gắn principal demo cho môi trường development/test hoặc request có Bearer token.
 * Principal này chỉ phục vụ wire UI, không được dùng làm nguồn cấp quyền production.
 */
export function attachDevPrincipal(req: Request, response: Response, next: NextFunction): void {
  void response;
  const authHeader = req.header('authorization');

  if (
    authHeader?.startsWith('Bearer ') ||
    config.app.env === 'development' ||
    config.app.env === 'test'
  ) {
    req.principal = {
      id: '11111111-1111-4111-8111-111111111111',
      userId: '11111111-1111-4111-8111-111111111111',
      username: 'reception.dev',
      fullName: 'Reception Dev',
      roleCodes: ['receptionist'],
      permissions: [
        'queue.read',
        'queue.call',
        'queue.manage',
        'reception.create',
        'patient.search',
        'emergency.create',
        'emergency.identity.normalize',
        'invoice.create',
        'invoice.read',
        'invoice.cancel',
        'invoice.write_off',
        'statement.sign',
        'payment.cash.create',
        'payment.momo.create',
        'payment.read',
        'payment_advance.write',
        'payment_advance.read',
      ],
      departmentId: 'dept-reception',
      isActive: true,
      mustChangePassword: false,
      authVersion: 1,
    };
  }

  next();
}

/** Kiểm tra permission trên request đã có principal hợp lệ. */
export function requirePermission(permission: string) {
  return (req: Request, response: Response, next: NextFunction): void => {
    void response;
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
