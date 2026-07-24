import bcrypt from 'bcryptjs';

import { AppError } from '../../../core/errors/app-error';
import { recordAuditLog } from '../../audit/services/audit.service';
import { findUserById, findUserByUsername, roleCodesOf, touchLastLogin } from '../repositories/auth.repository';
import { signAccessToken } from './jwt.service';
import type { Principal } from '../types/auth.types';

interface CreateSessionResult {
  accessToken: string;
  expiresAt: string;
  principal: Principal;
}

/**
 * @route POST /api/v1/auth/sessions
 * @desc Authenticate a staff member by employee code (username) and password.
 * @access Public
 * @throws {AppError} 401 INVALID_CREDENTIALS, 403 USER_INACTIVE
 */
export async function createSession(username: string, password: string): Promise<CreateSessionResult> {
  const user = await findUserByUsername(username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    await recordAuditLog({
      userId: user?.id ?? null,
      userRole: 'public',
      userName: username,
      action: 'LOGIN_FAILURE',
      resource: 'AuthSession',
    });
    throw AppError.unauthorized('INVALID_CREDENTIALS', 'Mã nhân viên hoặc mật khẩu không đúng.');
  }

  if (!user.isActive) {
    throw AppError.forbidden('USER_INACTIVE', 'Tài khoản đã bị vô hiệu hóa.');
  }

  const roleCodes = roleCodesOf(user);
  await touchLastLogin(user.id);
  const { accessToken, expiresAt } = signAccessToken({ userId: user.id, roleCodes });

  await recordAuditLog({
    userId: user.id,
    userRole: roleCodes[0] ?? 'unknown',
    userName: user.fullName,
    action: 'LOGIN_SUCCESS',
    resource: 'AuthSession',
    resourceId: user.id,
  });

  return {
    accessToken,
    expiresAt,
    principal: {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      roleCodes,
      departmentId: user.departmentId,
      isActive: user.isActive,
    },
  };
}

/**
 * @route GET /api/v1/auth/me
 * @desc Load the identity/permissions of the currently authenticated principal.
 * @access Protected
 * @throws {AppError} 401 UNAUTHENTICATED, 403 USER_INACTIVE
 */
export async function getCurrentPrincipal(userId: string): Promise<Principal> {
  const user = await findUserById(userId);

  if (!user) {
    throw AppError.unauthorized('UNAUTHENTICATED', 'Không xác thực được người dùng.');
  }

  if (!user.isActive) {
    throw AppError.forbidden('USER_INACTIVE', 'Tài khoản đã bị vô hiệu hóa.');
  }

  return {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    roleCodes: roleCodesOf(user),
    departmentId: user.departmentId,
    isActive: user.isActive,
  };
}
