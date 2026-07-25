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
});
