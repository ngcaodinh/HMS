import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../config/unified-config';
import { sendError } from '../core/http/response-envelope';
import { identityRepository } from '../modules/identity/identity-composition';
import { jwtPort } from '../modules/identity/jwt-port';
import type { StaffUserRecord } from '../modules/identity/identity-types';

export interface JwtPayload {
  userId?: string;
  sub?: string;
  username?: string;
  role?: string;
  roleCodes?: string[];
  permissions?: string[];
  departmentId?: string;
}

type RequestUser = NonNullable<Request['user']>;

const unauthorizedTokenMessage = 'Token xác thực không hợp lệ hoặc đã hết hạn';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Nhận diện token Identity v2 để resolve role từ DB; dữ liệu decode chỉ dùng để chọn nhanh xử lý.
const isIdentityTokenPayload = (
  payload: unknown,
): payload is { authVersion: number; userId: string } =>
  isRecord(payload) &&
  typeof payload.userId === 'string' &&
  typeof payload.authVersion === 'number';

// Map user của Identity module về req.user cho các route legacy đang dùng authorize cũ.
const toLegacyRequestUser = (user: StaffUserRecord): RequestUser => ({
  departmentId: user.departmentId,
  id: user.id,
  permissions: [],
  role: user.roleCodes[0] ?? 'user',
  roleCodes: user.roleCodes,
  username: user.username,
});

// Xác thực Identity token bằng issuer/audience/authVersion rồi lấy role hiện hành từ DB.
const authenticateIdentityToken = async (token: string): Promise<RequestUser | null> => {
  const payload = jwtPort.verify(token);
  const user = await identityRepository.findUserById(payload.userId);

  if (!user || !user.isActive || user.authVersion !== payload.authVersion) return null;

  return toLegacyRequestUser(user);
};

// Giữ tương thích token legacy có role/roleCodes trực tiếp trong JWT.
const authenticateLegacyToken = (token: string): RequestUser => {
  const jwtSecret: string =
    (config.auth as { jwtSecret?: string })?.jwtSecret ||
    process.env.JWT_SECRET ||
    'dev-secret-key';
  const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
  const roleCodes = Array.isArray(decoded.roleCodes) ? decoded.roleCodes : [];

  return {
    departmentId: decoded.departmentId,
    id: decoded.userId || decoded.sub || '',
    permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
    role: roleCodes[0] || decoded.role || 'user',
    roleCodes,
    username: decoded.username || 'user',
  };
};

const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
  token: string,
) => {
  try {
    const decodedPreview = jwt.decode(token);
    const user = isIdentityTokenPayload(decodedPreview)
      ? await authenticateIdentityToken(token)
      : authenticateLegacyToken(token);

    if (!user) {
      return sendError(res, 401, 'UNAUTHORIZED', unauthorizedTokenMessage);
    }

    req.user = user;
    return next();
  } catch {
    return sendError(res, 401, 'UNAUTHORIZED', unauthorizedTokenMessage);
  }
};

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Yêu cầu token xác thực (Bearer token)');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Yêu cầu token xác thực (Bearer token)');
  }

  return authenticateToken(req, res, next, token);
};
