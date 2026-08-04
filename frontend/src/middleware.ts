import { NextResponse, type NextRequest } from 'next/server';

import {
  canAccessStaffPath,
  isPublicPath,
  isStaffPath,
  normalizeRoleCodes,
  resolveRoleHomePath,
} from './shared/auth/role-routing';
import { backendApiV1BaseUrl } from './shared/auth/backend-url';
import { fetchMiddlewarePrincipal } from './shared/auth/middleware-principal';
import { sessionCookieName } from './shared/auth/session-cookie';

const createLoginRedirect = (request: NextRequest, reason?: 'session_expired') => {
  const loginUrl = new URL('/login', request.url);
  if (reason) loginUrl.searchParams.set('reason', reason);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(sessionCookieName);

  return response;
};

const createForbiddenResponse = (homePath: string | null) =>
  new NextResponse(
    `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>403 | HMS</title>
    <style>
      body {
        align-items: center;
        background: #f8fafc;
        color: #0f172a;
        display: flex;
        font-family: Arial, sans-serif;
        justify-content: center;
        margin: 0;
        min-height: 100vh;
        padding: 24px;
      }
      main {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
        max-width: 440px;
        padding: 28px;
        text-align: center;
      }
      p.code {
        color: #b91c1c;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.08em;
        margin: 0;
      }
      h1 {
        font-size: 24px;
        margin: 10px 0;
      }
      p.message {
        color: #475569;
        font-size: 15px;
        line-height: 1.6;
        margin: 0 0 20px;
      }
      a {
        color: #0369a1;
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main>
      <p class="code">403</p>
      <h1>Không đủ quyền truy cập</h1>
      <p class="message">Tài khoản hiện tại không được phân quyền mở màn hình này.</p>
      ${homePath ? `<a href="${homePath}">Về trang làm việc của tôi</a>` : ''}
    </main>
  </body>
</html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
      status: 403,
    },
  );

const createAuthUnavailableResponse = () =>
  new NextResponse(
    `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>503 | HMS</title>
    <style>
      body {
        align-items: center;
        background: #f8fafc;
        color: #0f172a;
        display: flex;
        font-family: Arial, sans-serif;
        justify-content: center;
        margin: 0;
        min-height: 100vh;
        padding: 24px;
      }
      main {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
        max-width: 440px;
        padding: 28px;
        text-align: center;
      }
      p.code {
        color: #b91c1c;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.08em;
        margin: 0;
      }
      h1 {
        font-size: 24px;
        margin: 10px 0;
      }
      p.message {
        color: #475569;
        font-size: 15px;
        line-height: 1.6;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <main>
      <p class="code">503</p>
      <h1>Dịch vụ xác thực chưa sẵn sàng</h1>
      <p class="message">Không thể kiểm tra phiên đăng nhập lúc này. Vui lòng kiểm tra backend API và tải lại trang.</p>
    </main>
  </body>
</html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
      status: 503,
    },
  );

/**
 * Guard route nhân viên ở edge: chưa đăng nhập về /login, sai role trả 403.
 * Middleware chỉ đọc principal từ backend bằng cookie httpOnly, không đưa JWT xuống client JS.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname) || !isStaffPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(sessionCookieName)?.value;
  if (!token) return createLoginRedirect(request, 'session_expired');

  const authResult = await fetchMiddlewarePrincipal({
    backendBaseUrl: backendApiV1BaseUrl,
    token,
  });

  if (authResult.status === 'unavailable') return createAuthUnavailableResponse();
  if (authResult.status === 'unauthenticated') {
    return createLoginRedirect(request, 'session_expired');
  }
  if (authResult.status === 'forbidden') return createForbiddenResponse(null);

  const { principal } = authResult;

  if (principal?.mustChangePassword) {
    return NextResponse.redirect(new URL('/change-password', request.url));
  }

  const roleCodes = normalizeRoleCodes(principal?.roleCodes);
  if (!canAccessStaffPath(pathname, roleCodes)) {
    return createForbiddenResponse(resolveRoleHomePath(roleCodes));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
