import { Router } from 'express';

import { asyncHandler } from '../../core/http/asyncHandler';
import { IdentityController } from './IdentityController';
import { identityService } from './identityComposition';
import { authenticate } from './identityMiddleware';
import { loginRateLimiter } from './loginRateLimiter';

const controller = new IdentityController(identityService);

export const identityRoutes = Router();

/**
 * @route   POST /api/v1/auth/sessions
 * @desc    Đăng nhập nhân viên và trả JWT cho BFF lưu vào cookie bảo mật.
 * @access  Public
 */
identityRoutes.post(
  '/auth/sessions',
  loginRateLimiter,
  asyncHandler((req, res) => controller.createSession(req, res)),
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Trả thông tin principal hiện tại sau khi xác thực JWT.
 * @access  Authenticated staff
 */
identityRoutes.get(
  '/auth/me',
  asyncHandler(authenticate),
  asyncHandler((req, res) => controller.getCurrentPrincipal(req, res)),
);

/**
 * @route   PUT /api/v1/auth/password
 * @desc    Đổi mật khẩu của chính nhân viên đang đăng nhập.
 * @access  Authenticated staff
 */
identityRoutes.put(
  '/auth/password',
  asyncHandler(authenticate),
  asyncHandler((req, res) => controller.changePassword(req, res)),
);

/**
 * @route   GET /api/v1/staff-users
 * @desc    Liệt kê tài khoản nhân viên theo quyền staff.read và phạm vi vai trò.
 * @access  staff.read
 */
identityRoutes.get(
  '/staff-users',
  asyncHandler(authenticate),
  asyncHandler((req, res) => controller.listStaffUsers(req, res)),
);

/**
 * @route   POST /api/v1/staff-users
 * @desc    Tạo tài khoản nhân viên và trả mật khẩu tạm thời một lần.
 * @access  staff.create
 */
identityRoutes.post(
  '/staff-users',
  asyncHandler(authenticate),
  asyncHandler((req, res) => controller.createStaffAccount(req, res)),
);

/**
 * @route   PATCH /api/v1/staff-users/:userId
 * @desc    Cập nhật hồ sơ, trạng thái hoặc vai trò với kiểm tra optimistic lock.
 * @access  staff.update
 */
identityRoutes.patch(
  '/staff-users/:userId',
  asyncHandler(authenticate),
  asyncHandler((req, res) => controller.updateStaffAccount(req, res)),
);

/**
 * @route   POST /api/v1/staff-users/:userId/password-resets
 * @desc    Reset mật khẩu nhân viên và bắt buộc đổi mật khẩu ở lần đăng nhập sau.
 * @access  staff.password.reset
 */
identityRoutes.post(
  '/staff-users/:userId/password-resets',
  asyncHandler(authenticate),
  asyncHandler((req, res) => controller.resetStaffPassword(req, res)),
);
