import type { NextFunction, Response } from 'express';

import { AppError } from '../../core/http/AppError';
import { identityRepository } from './identityComposition';
import { jwtPort } from './jwtPort';
import type { AuthenticatedRequest } from './identityTypes';

/**
 * Xác thực Bearer JWT, kiểm tra authVersion để phát hiện token đã bị thu hồi.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authorization = req.header('authorization');
    const [, token] = authorization?.match(/^Bearer\s+(.+)$/i) ?? [];

    if (!token) {
      throw new AppError({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Cần đăng nhập để tiếp tục',
        status: 401,
      });
    }

    const payload = jwtPort.verify(token);
    const user = await identityRepository.findUserById(payload.userId);

    if (!user || !user.isActive || user.authVersion !== payload.authVersion) {
      throw new AppError({
        code: 'TOKEN_REVOKED',
        message: 'Phiên đăng nhập đã hết hiệu lực',
        status: 401,
      });
    }

    const { password, ...principal } = user;
    void password;
    req.principal = principal;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Bảo đảm handler chỉ chạy khi request đã có principal hợp lệ.
 */
export const requirePrincipal = (req: AuthenticatedRequest) => {
  if (req.principal) return req.principal;

  throw new AppError({
    code: 'AUTHENTICATION_REQUIRED',
    message: 'Cần đăng nhập để tiếp tục',
    status: 401,
  });
};
