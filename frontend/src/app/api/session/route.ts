import { NextResponse, type NextRequest } from 'next/server';

import { buildBackendApiV1Url } from '@/shared/auth/backend-url';

const SESSION_COOKIE = 'hms_session';

/**
 * BFF đăng nhập legacy: chuyển credential tới backend và lưu session trong cookie httpOnly.
 *
 * @route   POST /api/session
 * @desc    Đổi credential lấy session backend và chỉ trả principal cho browser.
 * @access  Public; handler không yêu cầu JWT trước khi đăng nhập.
 * @remarks Body được forward nguyên trạng, lỗi giữ status/envelope backend; success không trả
 * giá trị session cho JavaScript phía client.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();

  const backendResponse = await fetch(buildBackendApiV1Url('/auth/sessions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });

  const payload = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(payload, { status: backendResponse.status });
  }

  const response = NextResponse.json(
    { data: { principal: payload.data.principal } },
    { status: 201 },
  );
  response.cookies.set(SESSION_COOKIE, payload.data.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(payload.data.expiresAt),
  });
  return response;
}

/**
 * @route   DELETE /api/session
 * @desc    Xóa cookie session ở BFF.
 * @access  Public; có thể gọi khi session đã hết hạn.
 * @returns Envelope xác nhận logout và response có cookie session đã bị xóa.
 */
export async function DELETE() {
  const response = NextResponse.json({ data: { loggedOut: true } });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
