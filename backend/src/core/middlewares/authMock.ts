import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock Auth Middleware for Sprint 1 (Lane 6)
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nurse = await prisma.user.findUnique({ where: { username: 'nurse.lane6' } });
    if (nurse) {
      req.user = {
        id: nurse.id,
        username: nurse.username,
        role: 'nurse',
        permissions: ['inpatient.read', 'bed.assign', 'bed.change', 'treatment_order.read', 'treatment_order.execute', 'treatment_order.cancel', 'discharge.execute'],
        departmentId: nurse.departmentId
      };
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Không có quyền truy cập',
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
        permissions: string[];
        departmentId?: string;
      };
    }
  }
}
