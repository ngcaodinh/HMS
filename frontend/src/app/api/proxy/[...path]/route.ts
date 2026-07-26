import { NextResponse, type NextRequest } from 'next/server';

import { assertSameOrigin, forbiddenOrigin } from '@/shared/auth/backend';
import { buildBackendApiV1Url } from '@/shared/auth/backend-url';

const SESSION_COOKIE = 'hms_session';
const FORWARDED_REQUEST_HEADERS = ['content-type', 'accept', 'idempotency-key', 'x-request-id'];
const PASSTHROUGH_RESPONSE_HEADERS = ['content-type', 'content-disposition'];

/**
 * BFF proxy chuyển request `/api/proxy/*` sang backend thật, tự gắn JWT từ cookie httpOnly.
 * Chỉ forward whitelist header nghiệp vụ để giữ idempotency/upload mà không lộ cookie trình duyệt.
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
