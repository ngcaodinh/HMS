import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

import { config } from '../../config/unified-config';
import { AppError } from '../../core/http/app-error';
import type { JwtPort } from './identity-types';

/**
 * Adapter JWT ký và xác thực access token theo issuer/audience cấu hình.
 */
export const jwtPort: JwtPort = {
  sign(payload, signOptions) {
    const options: SignOptions = {
      audience: config.auth.jwtAudience,
      expiresIn: (signOptions?.expiresIn ?? config.auth.jwtExpiresIn) as SignOptions['expiresIn'],
      issuer: config.auth.jwtIssuer,
    };

    const token = jwt.sign(payload, config.auth.jwtSecret, options);
    const decoded = jwt.decode(token);

    if (!decoded || typeof decoded !== 'object' || typeof decoded.exp !== 'number') {
      throw new AppError({
        code: 'TOKEN_EXPIRATION_MISSING',
        message: 'Không thể xác định thời hạn phiên đăng nhập',
        status: 500,
      });
    }

    return {
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      token,
    };
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
      // Không lộ chi tiết lỗi JWT để tránh hỗ trợ dò token.
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
