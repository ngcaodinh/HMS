import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { AppError } from '../core/errors/app-error';
import { findUserById, roleCodesOf } from '../modules/auth/repositories/auth.repository';
import { verifyAccessToken } from '../modules/auth/services/jwt.service';
import { recordAuditLog } from '../modules/audit/services/audit.service';
import { isActionAllowed } from '../modules/rbac/services/rbac.service';

/**
 * authorizeAndAudit() — internal Express middleware (Lane 1 contract).
 * Verifies the bearer JWT, reloads the user's current `isActive`/roles from DB on every
 * request (tokens are never trusted as the source of truth), attaches `req.principal`,
 * then enforces the RBAC policy for `action` (when provided) and audits denials.
 * @param {string} [action] Policy action code declared in `role-policy.ts`. Omit to only
 * require a valid, active session (e.g. `GET /auth/me`).
 */
export function authorizeAndAudit(action?: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        throw AppError.unauthorized('UNAUTHENTICATED', 'Thiếu token xác thực.');
      }

      const token = header.slice('Bearer '.length);
      let payload;
      try {
        payload = verifyAccessToken(token);
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          throw AppError.unauthorized('TOKEN_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
        }
        throw AppError.unauthorized('UNAUTHENTICATED', 'Token không hợp lệ.');
      }

      const user = await findUserById(payload.userId);
      if (!user) {
        throw AppError.unauthorized('UNAUTHENTICATED', 'Không xác thực được người dùng.');
      }
      if (!user.isActive) {
        throw AppError.forbidden('USER_INACTIVE', 'Tài khoản đã bị vô hiệu hóa.');
      }

      const roleCodes = roleCodesOf(user);
      req.principal = {
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        roleCodes,
        departmentId: user.departmentId,
        isActive: user.isActive,
      };

      if (action && !isActionAllowed(roleCodes, action)) {
        await recordAuditLog({
          userId: user.id,
          userRole: roleCodes[0] ?? 'unknown',
          userName: user.fullName,
          action: 'VIEW',
          resource: action,
          metadata: { denied: true },
        });
        throw AppError.forbidden('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
