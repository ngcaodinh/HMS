import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

import { config } from '../../config/unifiedConfig';
import { AppError } from '../../core/http/AppError';
import type { JwtPort } from './identityTypes';

export const jwtPort: JwtPort = {
  sign(payload) {
    const options: SignOptions = {
      audience: config.auth.jwtAudience,
      expiresIn: config.auth.jwtExpiresIn as SignOptions['expiresIn'],
      issuer: config.auth.jwtIssuer,
    };

    return jwt.sign(payload, config.auth.jwtSecret, options);
  },
  verify(token) {
    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret, {
        audience: config.auth.jwtAudience,
        issuer: config.auth.jwtIssuer,
      });

      if (
        typeof decoded === 'object' &&
        typeof decoded.userId === 'string' &&
        typeof decoded.authVersion === 'number'
      ) {
        return {
          authVersion: decoded.authVersion,
          userId: decoded.userId,
        };
      }
    } catch {
      throw new AppError({
        code: 'INVALID_TOKEN',
        message: 'Phiên đăng nhập không hợp lệ',
        status: 401,
      });
    }

    throw new AppError({
      code: 'INVALID_TOKEN',
      message: 'Phiên đăng nhập không hợp lệ',
      status: 401,
    });
  },
};
