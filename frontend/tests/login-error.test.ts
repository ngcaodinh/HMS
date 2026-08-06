/** Bảo đảm lỗi đăng nhập không lộ chi tiết backend, nhưng vẫn phân biệt khóa và rate limit. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApiError } from '../src/shared/api-client';
import {
  getLoginErrorMessage,
  lockedAccountMessage,
  loginFailedMessage,
} from '../src/modules/auth/utils/login-error';

describe('getLoginErrorMessage', () => {
  it('shows locked account guidance for inactive users', () => {
    const error = new ApiError({
      code: 'USER_INACTIVE',
      message: 'Tài khoản đã bị khóa',
      status: 403,
    });

    assert.equal(getLoginErrorMessage(error), lockedAccountMessage);
  });

  it('keeps invalid credential errors generic', () => {
    const error = new ApiError({
      code: 'INVALID_CREDENTIALS',
      message: 'Sai tài khoản hoặc mật khẩu',
      status: 401,
    });

    assert.equal(getLoginErrorMessage(error), loginFailedMessage);
  });

  it('shows the rate-limit guidance for a throttled login response', () => {
    const error = new ApiError({
      code: 'LOGIN_RATE_LIMITED',
      message: 'Too many attempts',
      status: 429,
    });

    assert.equal(
      getLoginErrorMessage(error),
      'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút.',
    );
  });

  it('uses the credential message for a validation response', () => {
    const error = new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      status: 400,
    });

    assert.equal(getLoginErrorMessage(error), loginFailedMessage);
  });

  it('does not reveal backend details for unknown API failures', () => {
    const error = new ApiError({
      code: 'INTERNAL_ERROR',
      message: 'Database connection details',
      status: 500,
    });

    assert.equal(getLoginErrorMessage(error), 'Không thể đăng nhập, vui lòng thử lại!');
  });

  it('normalizes non-API failures to the generic login message', () => {
    assert.equal(
      getLoginErrorMessage(new Error('network failure')),
      'Không thể đăng nhập, vui lòng thử lại!',
    );
  });

  it('does not classify an inactive code with the wrong status as a locked account', () => {
    const error = new ApiError({
      code: 'USER_INACTIVE',
      message: 'Inactive',
      status: 500,
    });

    assert.equal(getLoginErrorMessage(error), 'Không thể đăng nhập, vui lòng thử lại!');
  });
});
