import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  backendFetch,
  clearSessionCookie,
  forbiddenOrigin,
  setSessionCookie,
} from '@/shared/auth/backend';

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
  const nextResponse = NextResponse.json(
    response.ok
      ? {
          data: {
            principal: payload.data.principal,
          },
        }
      : payload,
    { status: response.status },
  );

  if (response.status === 401) clearSessionCookie(nextResponse);
  if (response.ok) setSessionCookie(nextResponse, payload.data.accessToken);

  return nextResponse;
}
