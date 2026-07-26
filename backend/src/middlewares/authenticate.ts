import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/unifiedConfig';
import { sendError } from '../core/http/response-envelope';

export interface JwtPayload {
  userId?: string;
  sub: string;
  username: string;
  role: string;
  roleCodes?: string[];
  permissions?: string[];
  departmentId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
        roleCodes: string[];
        permissions: string[];
        departmentId?: string;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Yêu cầu token xác thực (Bearer token)');
  }

  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret: string = (config.auth as any)?.jwtSecret || process.env.JWT_SECRET || 'dev-secret-key';
    const decoded = (jwt.verify as any)(token, jwtSecret) as JwtPayload;
    const roleCodes = Array.isArray(decoded.roleCodes) ? decoded.roleCodes : [];
    req.user = {
      id: decoded.userId || decoded.sub,
      username: decoded.username || 'user',
      role: roleCodes[0] || decoded.role || 'user',
      roleCodes,
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
      departmentId: decoded.departmentId,
    };
    return next();
  } catch (error) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Token xác thực không hợp lệ hoặc đã hết hạn');
  }
};
