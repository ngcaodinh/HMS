import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  forbiddenOrigin,
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
    return NextResponse.json(payload, { status: response.status });
  }

  const principal = payload.data.principal;
  const nextResponse = NextResponse.json({
    data: {
      homePath: resolveRoleHomePath(principal.roleCodes ?? []),
      principal,
    },
  });

  setSessionCookie(nextResponse, payload.data.accessToken);
  return nextResponse;
}
