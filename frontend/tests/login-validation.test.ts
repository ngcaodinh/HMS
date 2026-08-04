import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validateLoginCredentials } from '../src/modules/auth/constants/login-validation';

describe('validateLoginCredentials', () => {
  it('returns no field errors for a valid username and non-empty password', () => {
    assert.deepEqual(validateLoginCredentials('doctor.managed', 'Secret#2026'), {});
  });

  it('reports the username field when it is empty', () => {
    assert.deepEqual(validateLoginCredentials('', 'Secret#2026'), {
      username: 'Vui lòng nhập tên đăng nhập',
    });
  });

  it('reports the password field when it is empty', () => {
    assert.deepEqual(validateLoginCredentials('doctor.managed', ''), {
      password: 'Vui lòng nhập mật khẩu',
    });
  });

  it('reports both fields when username and password are empty', () => {
    assert.deepEqual(validateLoginCredentials('', ''), {
      password: 'Vui lòng nhập mật khẩu',
      username: 'Vui lòng nhập tên đăng nhập',
    });
  });

  it('accepts username at the minimum and maximum lengths', () => {
    assert.deepEqual(validateLoginCredentials('abc', 'secret'), {});
    assert.deepEqual(validateLoginCredentials('a'.repeat(50), 'secret'), {});
  });

  it('rejects username shorter or longer than the backend contract', () => {
    assert.deepEqual(validateLoginCredentials('ab', 'secret'), {
      username: 'Tên đăng nhập phải có từ 3 đến 50 ký tự',
    });
    assert.deepEqual(validateLoginCredentials('a'.repeat(51), 'secret'), {
      username: 'Tên đăng nhập phải có từ 3 đến 50 ký tự',
    });
  });

  it('rejects username characters outside the backend contract', () => {
    assert.deepEqual(validateLoginCredentials('doctor managed', 'secret'), {
      username: 'Tên đăng nhập chỉ gồm chữ, số, dấu chấm hoặc gạch dưới',
    });
    assert.deepEqual(validateLoginCredentials('bác-sĩ', 'secret'), {
      username: 'Tên đăng nhập chỉ gồm chữ, số, dấu chấm hoặc gạch dưới',
    });
  });
});
