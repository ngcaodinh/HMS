import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  forbiddenOrigin,
  getSessionMaxAge,
  setSessionCookie,
} from '@/shared/auth/backend';
import { buildBackendApiV1Url } from '@/shared/auth/backend-url';
import { resolveRoleHomePath } from '@/shared/auth/role-routing';

/**
 * @route   POST /api/auth/login
 * @desc    Proxy đăng nhập, giữ JWT trong cookie httpOnly thay vì trả về client.
 * @access  Public cùng origin
 */
export async function POST(request: Request) {
  if (!assertSameOrigin()) return forbiddenOrigin();

  const response = await fetch(buildBackendApiV1Url('/auth/sessions'), {
    body: await request.text(),
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  const payload = await response.json();

  if (!response.ok) {
    const retryAfterHeader = response.headers.get('retry-after');
    const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : NaN;

    if (
      response.status === 429 &&
      Number.isInteger(retryAfterSeconds) &&
      retryAfterSeconds >= 0 &&
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      payload.error &&
      typeof payload.error === 'object'
    ) {
      const nextPayload = {
        ...payload,
        error: {
          ...payload.error,
          retryAfterSeconds,
        },
      };
      const nextResponse = NextResponse.json(nextPayload, { status: response.status });
      nextResponse.headers.set('Retry-After', String(retryAfterSeconds));

      return nextResponse;
    }

    return NextResponse.json(payload, { status: response.status });
  }

  const principal = payload.data.principal;
  const nextResponse = NextResponse.json({
    data: {
      homePath: resolveRoleHomePath(principal.roleCodes ?? []),
      principal,
    },
  });

  setSessionCookie(nextResponse, payload.data.accessToken, getSessionMaxAge(payload.data.expiresAt));
  return nextResponse;
}
