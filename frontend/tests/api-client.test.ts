/** Kiểm tra fetch boundary chuẩn hóa envelope, lỗi trường, Retry-After và bảo toàn lỗi abort. */
import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { apiClient } from '../src/shared/api-client/client';
import { ApiError } from '../src/shared/api-client/error';

const originalFetch = globalThis.fetch;

const createJsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    status: init.status ?? 200,
  });

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('apiClient', () => {
  it('returns data from a success envelope and sends JSON credentials by default', async () => {
    let capturedRequest: { input: RequestInfo | URL; init?: RequestInit } | undefined;

    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      capturedRequest = { input, init };
      return Promise.resolve(createJsonResponse({ data: { ok: true } }));
    }) as typeof fetch;

    const result = await apiClient<{ ok: boolean }>('/api/staff-users', {
      body: {
        username: 'doctor.managed',
      },
      headers: {
        'If-Unmodified-Since': '2026-07-24T08:00:00.000Z',
      },
      method: 'POST',
    });

    assert.deepEqual(result, { ok: true });
    assert.equal(capturedRequest?.input, '/api/staff-users');
    assert.equal(capturedRequest?.init?.body, JSON.stringify({ username: 'doctor.managed' }));
    assert.equal(capturedRequest?.init?.cache, 'no-store');
    assert.equal(capturedRequest?.init?.credentials, 'include');
    assert.equal(capturedRequest?.init?.headers instanceof Object, true);
  });

  it('throws ApiError with normalized field errors from error.fields', async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        createJsonResponse(
          {
            error: {
              code: 'VALIDATION_ERROR',
              fields: {
                password: 'invalid-shape',
                username: ['Tên đăng nhập đã tồn tại'],
              },
              message: 'Dữ liệu đầu vào không hợp lệ',
            },
          },
          { status: 400 },
        ),
      )) as typeof fetch;

    await assert.rejects(apiClient('/api/staff-users'), (error) => {
      assert.equal(error instanceof ApiError, true);
      if (!(error instanceof ApiError)) return false;

      assert.equal(error.code, 'VALIDATION_ERROR');
      assert.equal(error.status, 400);
      assert.deepEqual(error.fields, {
        username: ['Tên đăng nhập đã tồn tại'],
      });
      assert.equal(error.hasFieldErrors, true);

      return true;
    });
  });

  it('falls back to error.details when a legacy backend omits error.fields', async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        createJsonResponse(
          {
            error: {
              code: 'VALIDATION_ERROR',
              details: [
                { field: 'identityCardNumber', message: 'CCCD đã tồn tại', rule: 'unique' },
                { field: 'phoneNumber', rule: 'invalid_string' },
                { rule: 'custom' },
              ],
              message: 'Dữ liệu đầu vào không hợp lệ',
            },
          },
          { status: 400 },
        ),
      )) as typeof fetch;

    await assert.rejects(apiClient('/api/staff-users'), (error) => {
      assert.equal(error instanceof ApiError, true);
      if (!(error instanceof ApiError)) return false;

      assert.deepEqual(error.fields, {
        identityCardNumber: ['unique'],
        phoneNumber: ['invalid_string'],
      });

      return true;
    });
  });

  it('preserves a valid Retry-After value from the backend error envelope', async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        createJsonResponse(
          {
            error: {
              code: 'LOGIN_RATE_LIMITED',
              message: 'Too many attempts',
              retryAfterSeconds: 45,
            },
          },
          { status: 429 },
        ),
      )) as typeof fetch;

    await assert.rejects(apiClient('/api/auth/login', { method: 'POST' }), (error) => {
      assert.equal(error instanceof ApiError, true);
      if (!(error instanceof ApiError)) return false;

      assert.equal(error.retryAfterSeconds, 45);
      return true;
    });
  });

  it('clamps negative Retry-After values and ignores non-integer values', async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        createJsonResponse(
          {
            error: {
              code: 'LOGIN_RATE_LIMITED',
              message: 'Too many attempts',
              retryAfterSeconds: -1,
            },
          },
          { status: 429 },
        ),
      )) as typeof fetch;

    await assert.rejects(apiClient('/api/auth/login', { method: 'POST' }), (error) => {
      assert.equal(error instanceof ApiError, true);
      if (!(error instanceof ApiError)) return false;

      assert.equal(error.retryAfterSeconds, 0);
      return true;
    });

    globalThis.fetch = (() =>
      Promise.resolve(
        createJsonResponse(
          {
            error: {
              code: 'LOGIN_RATE_LIMITED',
              message: 'Too many attempts',
              retryAfterSeconds: 1.5,
            },
          },
          { status: 429 },
        ),
      )) as typeof fetch;

    await assert.rejects(apiClient('/api/auth/login', { method: 'POST' }), (error) => {
      assert.equal(error instanceof ApiError, true);
      if (!(error instanceof ApiError)) return false;

      assert.equal(error.retryAfterSeconds, undefined);
      return true;
    });
  });

  it('treats malformed JSON and missing data envelopes as invalid responses', async () => {
    globalThis.fetch = (() =>
      Promise.resolve(new Response('{bad-json', { status: 200 }))) as typeof fetch;

    await assert.rejects(apiClient('/api/staff-users'), {
      code: 'INVALID_RESPONSE',
      status: 200,
    });

    globalThis.fetch = (() =>
      Promise.resolve(
        createJsonResponse({ meta: { requestId: 'req-missing-data' } }),
      )) as typeof fetch;

    await assert.rejects(apiClient('/api/staff-users'), {
      code: 'INVALID_RESPONSE',
      status: 200,
    });
  });

  it('normalizes network failures while preserving abort cancellations', async () => {
    globalThis.fetch = (() => Promise.reject(new Error('connection refused'))) as typeof fetch;

    await assert.rejects(apiClient('/api/staff-users'), {
      code: 'NETWORK_ERROR',
      status: 0,
    });

    const abortError = new DOMException('Request aborted', 'AbortError');
    globalThis.fetch = (() => Promise.reject(abortError)) as typeof fetch;

    try {
      await apiClient('/api/staff-users');
      assert.fail('Expected apiClient to rethrow AbortError');
    } catch (error) {
      assert.equal(error, abortError);
    }
  });
});
