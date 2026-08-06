import { NextResponse, type NextRequest } from 'next/server';

import { assertSameOrigin, forbiddenOrigin } from '@/shared/auth/backend';
import { buildBackendApiV1Url } from '@/shared/auth/backend-url';

const SESSION_COOKIE = 'hms_session';
// Chỉ chuyển tiếp header cần cho content negotiation, upload và idempotency; không chuyển cookie.
const FORWARDED_REQUEST_HEADERS = ['content-type', 'accept', 'idempotency-key', 'x-request-id'];
// Giữ lại các header mô tả response mà caller cần để parse dữ liệu hoặc tải file.
const PASSTHROUGH_RESPONSE_HEADERS = ['content-type', 'content-disposition'];

/**
 * Chuyển request `/api/proxy/*` sang backend và gắn session từ cookie httpOnly vào Authorization.
 *
 * @param req Request Next.js từ browser.
 * @param path Các segment sau `/api/proxy/`, được ghép thành path backend.
 * @returns Response backend với status/body và whitelist response headers được giữ lại.
 * @remarks GET/HEAD không yêu cầu same-origin; các method mutation phải qua `assertSameOrigin`.
 * Request body chỉ được đọc cho method có body, cookie trình duyệt không được forward, còn lỗi
 * mạng/fetch không được chuẩn hóa tại đây mà được để route runtime xử lý.
 */
async function forward(req: NextRequest, path: string[]) {
  if (!['GET', 'HEAD'].includes(req.method) && !assertSameOrigin()) return forbiddenOrigin();

  const targetUrl = `${buildBackendApiV1Url(path.join('/'))}${req.nextUrl.search}`;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  const headers: Record<string, string> = {};
  for (const headerName of FORWARDED_REQUEST_HEADERS) {
    const value = req.headers.get(headerName);
    if (value) headers[headerName] = value;
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const hasBody = !['GET', 'HEAD'].includes(req.method);

  const backendResponse = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    cache: 'no-store',
  });

  const responseHeaders = new Headers();
  for (const headerName of PASSTHROUGH_RESPONSE_HEADERS) {
    const value = backendResponse.headers.get(headerName);
    if (value) responseHeaders.set(headerName, value);
  }

  return new NextResponse(await backendResponse.arrayBuffer(), {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

/** Chuyển route params của Next.js vào helper forward cho mọi HTTP method được export. */
async function handler(req: NextRequest, context: { params: { path: string[] } }) {
  return forward(req, context.params.path);
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};
