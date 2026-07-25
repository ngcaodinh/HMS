import { Request, Response, NextFunction } from 'express';
import { sendError } from '../core/http/response-envelope';

export const authorize = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Chưa xác thực người dùng');
    }

    const userPermissions = req.user.permissions || [];
    if (!userPermissions.includes(requiredPermission) && req.user.role !== 'admin') {
      return sendError(
        res,
        403,
        'FORBIDDEN_ACCESS',
        `Bạn không có quyền thực hiện thao tác này (yêu cầu quyền: ${requiredPermission})`
      );
    }

    return next();
  };
};
