/** Kiểm tra thời hạn cookie đổi từ ISO sang giây và fallback 0 khi không hợp lệ. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getSessionMaxAge } from '../src/shared/auth/session-expiration';

describe('getSessionMaxAge', () => {
  it('converts a future ISO expiration to whole seconds', () => {
    const now = Date.now();
    const expiresAt = new Date(now + 90_500).toISOString();

    assert.equal(getSessionMaxAge(expiresAt, now), 90);
  });

  it('returns zero when the token is already expired', () => {
    const now = Date.now();

    assert.equal(getSessionMaxAge(new Date(now - 1).toISOString(), now), 0);
  });

  it('returns zero for missing, malformed, or non-string expiration values', () => {
    assert.equal(getSessionMaxAge(undefined, Date.now()), 0);
    assert.equal(getSessionMaxAge(null, Date.now()), 0);
    assert.equal(getSessionMaxAge('not-a-date', Date.now()), 0);
  });
});
