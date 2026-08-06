import type { NextFunction, Request, Response } from 'express';

import { prisma } from '../prisma/prisma';

/** Middleware demo lấy user nurse từ database để phục vụ các route legacy. */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const nurse = await prisma.user.findUnique({ where: { username: 'nurse.lane6' } });

    if (nurse) {
      req.user = {
        id: nurse.id,
        username: nurse.username,
        role: 'nurse',
        roleCodes: ['nurse'],
        permissions: [
          'inpatient.read',
          'bed.assign',
          'bed.change',
          'treatment_order.read',
          'treatment_order.execute',
          'treatment_order.cancel',
          'discharge.execute',
        ],
        departmentId: nurse.departmentId,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};

/** Kiểm tra route legacy có được truy cập bởi một trong các role cho phép hay không. */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Không có quyền truy cập',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};
