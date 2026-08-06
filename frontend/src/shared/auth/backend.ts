import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { backendApiV1BaseUrl, buildBackendApiV1Url } from './backend-url';
import { sessionCookieName } from './session-cookie';
import { getSessionMaxAge } from './session-expiration';

export { getSessionMaxAge } from './session-expiration';

/** Base URL server-side của backend API v1, dùng làm đích cho các BFF route. */
export const backendBaseUrl = backendApiV1BaseUrl;

/**
 * Đọc giá trị phiên từ cookie httpOnly ở server side, không đưa dữ liệu cookie xuống client JS.
 * @returns Giá trị phiên hiện tại hoặc `undefined` khi request chưa có cookie tương ứng.
 */
export const getSessionToken = () => cookies().get(sessionCookieName)?.value;

/**
 * Ghi giá trị phiên vào cookie httpOnly để BFF tự gắn header `Authorization` khi gọi backend.
 * @remarks `maxAge` tính bằng giây và được làm tròn xuống, không âm; cookie chỉ có hiệu lực từ
 * root path và dùng `secure` trong production.
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
 * Side effect là ghi cookie hết hạn trên response để trình duyệt bỏ phiên cũ.
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
 * Kiểm tra request mutation có cùng host với request hiện tại để giảm rủi ro CSRF cho BFF route.
 * Trả `true` khi thiếu `Origin` hoặc `Host`; đây là chính sách hiện tại của BFF.
 */
export const assertSameOrigin = () => {
  const origin = headers().get('origin');
  const host = headers().get('host');

  if (!origin || !host) return true;

  return new URL(origin).host === host;
};

/**
 * Gọi backend API từ server route/page bằng path tương đối của API v1.
 * @returns Response gốc để route gọi tự quyết định parse hoặc passthrough envelope.
 * @remarks Request luôn `no-store`, đặt `Content-Type` JSON và tự gắn session hiện tại vào
 * header `Authorization` mặc định nếu cookie có mặt; header trong `init` vẫn có thể ghi đè theo
 * caller. Hàm không expose dữ liệu phiên cho client.
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
 * Chuyển nguyên body/status của backend về frontend và xóa cookie khi backend trả 401.
 * @remarks Giữ `Cache-Control` và `Content-Type` từ backend; chỉ dùng `no-store` khi backend
 * không cung cấp chỉ thị cache.
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
 * Tạo response dùng chung khi BFF phát hiện request mutation không cùng host.
 * Trả envelope lỗi 403 ổn định cho client-side API adapter.
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
