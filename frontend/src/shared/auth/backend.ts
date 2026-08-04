import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { backendApiV1BaseUrl, buildBackendApiV1Url } from './backend-url';
import { sessionCookieName } from './session-cookie';
import { getSessionMaxAge } from './session-expiration';

export { getSessionMaxAge } from './session-expiration';

export const backendBaseUrl = backendApiV1BaseUrl;

/**
 * Đọc JWT từ cookie httpOnly ở server side, không đưa token xuống client JS.
 * Trả undefined khi request chưa có phiên hợp lệ.
 */
export const getSessionToken = () => cookies().get(sessionCookieName)?.value;

/**
 * Lưu JWT vào cookie bảo mật để BFF tự gắn Authorization khi gọi backend.
 * Nhận response Next.js và access token, side effect là set cookie httpOnly trên response.
 */
export const setSessionCookie = (response: NextResponse, token: string, maxAge: number) => {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    maxAge: Math.max(0, Math.floor(maxAge)),
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
};

/**
 * Xóa session cookie khi logout, đổi mật khẩu hoặc backend trả 401.
 * Nhận response Next.js, side effect là ghi cookie hết hạn để trình duyệt bỏ phiên cũ.
 */
export const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set(sessionCookieName, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
};

/**
 * Chặn request đổi trạng thái từ origin khác để giảm rủi ro CSRF cho BFF route.
 * Đọc Origin/Host từ headers server-side và trả true khi request cùng origin hoặc không có Origin.
 */
export const assertSameOrigin = () => {
  const origin = headers().get('origin');
  const host = headers().get('host');

  if (!origin || !host) return true;

  return new URL(origin).host === host;
};

/**
 * Gọi backend API từ server route/page và tự đính kèm Bearer token nếu có.
 * Nhận path tương đối của API v1 và RequestInit, trả Response gốc để caller quyết định parse.
 */
export const backendFetch = async (path: string, init: RequestInit = {}) => {
  const token = getSessionToken();

  return fetch(buildBackendApiV1Url(path), {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
};

/**
 * Chuyển nguyên envelope backend về frontend, đồng thời clear cookie khi token hết hạn.
 * Nhận Response backend, trả NextResponse có no-store để không cache dữ liệu nhạy cảm.
 */
export const passthroughJson = async (response: Response) => {
  const body = await response.text();
  const nextResponse = new NextResponse(body, {
    headers: {
      'Cache-Control': response.headers.get('cache-control') ?? 'no-store',
      'Content-Type': response.headers.get('content-type') ?? 'application/json',
    },
    status: response.status,
  });

  if (response.status === 401) clearSessionCookie(nextResponse);

  return nextResponse;
};

/**
 * Response dùng chung khi BFF phát hiện request không cùng origin.
 * Trả envelope lỗi 403 ổn định cho client-side apiClient.
 */
export const forbiddenOrigin = () =>
  NextResponse.json(
    {
      error: {
        code: 'INVALID_ORIGIN',
        message: 'Nguồn yêu cầu không hợp lệ',
      },
    },
    { status: 403 },
  );
