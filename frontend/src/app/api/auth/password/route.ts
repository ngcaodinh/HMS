import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  backendFetch,
  clearSessionCookie,
  forbiddenOrigin,
  getSessionMaxAge,
  setSessionCookie,
} from '@/shared/auth/backend';
import { resolveRoleHomePath } from '@/shared/auth/role-routing';

/**
 * @route   PUT /api/auth/password
 * @desc    Đổi mật khẩu và cập nhật cookie bằng JWT mới cho phiên hiện tại.
 * @access  Authenticated staff cùng origin
 */
export async function PUT(request: Request) {
  if (!assertSameOrigin()) return forbiddenOrigin();

  const response = await backendFetch('/auth/password', {
    body: await request.text(),
    method: 'PUT',
  });
  const payload = await response.json();
  const principal = payload?.data?.principal;
  const nextResponse = NextResponse.json(
    response.ok
      ? {
          data: {
            homePath: resolveRoleHomePath(principal?.roleCodes ?? []),
            principal,
          },
        }
      : payload,
    { status: response.status },
  );

  if (response.status === 401) clearSessionCookie(nextResponse);
  if (response.ok) {
    setSessionCookie(nextResponse, payload.data.accessToken, getSessionMaxAge(payload.data.expiresAt));
  }

  return nextResponse;
}
