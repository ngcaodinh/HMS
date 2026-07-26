import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fetchMiddlewarePrincipal } from '../src/shared/auth/middleware-principal';

const createFetchResponse = (body: unknown, init: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });

describe('fetchMiddlewarePrincipal', () => {
  it('returns unavailable when the auth backend cannot be reached', async () => {
    const result = await fetchMiddlewarePrincipal({
      backendBaseUrl: 'http://localhost:4000/api/v1',
      fetcher: async () => {
        throw new TypeError('fetch failed');
      },
      token: 'token-1',
    });

    assert.deepEqual(result, { status: 'unavailable' });
  });

  it('returns unauthenticated when backend rejects the session token', async () => {
    const result = await fetchMiddlewarePrincipal({
      backendBaseUrl: 'http://localhost:4000/api/v1',
      fetcher: async () => createFetchResponse({ error: { code: 'UNAUTHORIZED' } }, { status: 401 }),
      token: 'expired-token',
    });

    assert.deepEqual(result, { status: 'unauthenticated' });
  });

  it('returns forbidden when backend responds with a non-OK authorization error', async () => {
    const result = await fetchMiddlewarePrincipal({
      backendBaseUrl: 'http://localhost:4000/api/v1',
      fetcher: async () => createFetchResponse({ error: { code: 'FORBIDDEN' } }, { status: 403 }),
      token: 'token-1',
    });

    assert.deepEqual(result, { status: 'forbidden' });
  });

  it('returns forbidden when a successful response has malformed JSON', async () => {
    const result = await fetchMiddlewarePrincipal({
      backendBaseUrl: 'http://localhost:4000/api/v1',
      fetcher: async () => new Response('{', { status: 200 }),
      token: 'token-1',
    });

    assert.deepEqual(result, { status: 'forbidden' });
  });

  it('returns forbidden when a successful response does not contain a principal object', async () => {
    const result = await fetchMiddlewarePrincipal({
      backendBaseUrl: 'http://localhost:4000/api/v1',
      fetcher: async () => createFetchResponse({ data: null }, { status: 200 }),
      token: 'token-1',
    });

    assert.deepEqual(result, { status: 'forbidden' });
  });

  it('returns the backend principal and forwards the bearer token', async () => {
    let requestedUrl = '';
    let authorization = '';
    const principal = {
      roleCodes: ['doctor'],
      userId: 'doctor-1',
    };

    const result = await fetchMiddlewarePrincipal({
      backendBaseUrl: 'http://localhost:4000/api/v1',
      fetcher: async (input, init) => {
        requestedUrl = String(input);
        authorization = new Headers(init?.headers).get('authorization') ?? '';

        return createFetchResponse({ data: principal }, { status: 200 });
      },
      token: 'token-1',
    });

    assert.deepEqual(result, { status: 'authenticated', principal });
    assert.equal(requestedUrl, 'http://localhost:4000/api/v1/auth/me');
    assert.equal(authorization, 'Bearer token-1');
  });
});
