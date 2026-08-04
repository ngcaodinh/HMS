import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { addRetryAfterToPayload } from '../src/app/api/auth/login/retry-after';

describe('addRetryAfterToPayload', () => {
  it('adds a valid non-negative integer to the error envelope', () => {
    const payload = { error: { code: 'LOGIN_RATE_LIMITED' } };

    assert.deepEqual(addRetryAfterToPayload(payload, 429, '45'), {
      payload: {
        error: {
          code: 'LOGIN_RATE_LIMITED',
          retryAfterSeconds: 45,
        },
      },
      retryAfterSeconds: 45,
    });
  });

  it('preserves zero as a valid countdown boundary', () => {
    assert.deepEqual(addRetryAfterToPayload({ error: {} }, 429, '0'), {
      payload: { error: { retryAfterSeconds: 0 } },
      retryAfterSeconds: 0,
    });
  });

  it('does not mutate or enrich invalid status and header combinations', () => {
    const payload = { error: { code: 'LOGIN_RATE_LIMITED' } };

    assert.deepEqual(addRetryAfterToPayload(payload, 401, '45'), { payload });
    assert.deepEqual(addRetryAfterToPayload(payload, 429, '-1'), { payload });
    assert.deepEqual(addRetryAfterToPayload(payload, 429, '1.5'), { payload });
    assert.deepEqual(addRetryAfterToPayload(payload, 429, 'not-a-number'), { payload });
    assert.deepEqual(addRetryAfterToPayload(payload, 429, null), { payload });
  });

  it('does not add a retry value when the backend payload has no error object', () => {
    assert.deepEqual(addRetryAfterToPayload({ data: {} }, 429, '45'), { payload: { data: {} } });
    assert.deepEqual(addRetryAfterToPayload(null, 429, '45'), { payload: null });
  });
});
