import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../core/http/response-envelope';
import { isActionAllowed } from '../modules/rbac/services/rbac.service';

export const authorize = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Chưa xác thực người dùng');
    }

    const userPermissions = req.user.permissions || [];
    const userRoles = [req.user.role, ...(req.user.roleCodes ?? [])].filter(Boolean);
    const hasPermission = userPermissions.includes(requiredPermission);
    const hasRoleAccess = isActionAllowed(userRoles, requiredPermission);

    if (!hasPermission && req.user.role !== 'admin' && !hasRoleAccess) {
      return sendError(
        res,
        403,
        'FORBIDDEN_ACCESS',
        `Bạn không có quyền thực hiện thao tác này (yêu cầu quyền: ${requiredPermission})`,
      );
    }

    return next();
  };
};
