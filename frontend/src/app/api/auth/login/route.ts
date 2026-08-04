import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  forbiddenOrigin,
  getSessionMaxAge,
  setSessionCookie,
} from '@/shared/auth/backend';
import { buildBackendApiV1Url } from '@/shared/auth/backend-url';
import { resolveRoleHomePath } from '@/shared/auth/role-routing';

import { addRetryAfterToPayload } from './retry-after';

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
    const retryAfter = addRetryAfterToPayload(
      payload,
      response.status,
      response.headers.get('retry-after'),
    );

    if (retryAfter.retryAfterSeconds !== undefined) {
      const nextResponse = NextResponse.json(retryAfter.payload, { status: response.status });
      nextResponse.headers.set('Retry-After', String(retryAfter.retryAfterSeconds));

      return nextResponse;
    }

    return NextResponse.json(retryAfter.payload, { status: response.status });
  }

  const principal = payload.data.principal;
  const nextResponse = NextResponse.json({
    data: {
      homePath: resolveRoleHomePath(principal.roleCodes ?? []),
      principal,
    },
  });

  setSessionCookie(
    nextResponse,
    payload.data.accessToken,
    getSessionMaxAge(payload.data.expiresAt),
  );
  return nextResponse;
}
