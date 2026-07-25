import { NextResponse, type NextRequest } from 'next/server';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const SESSION_COOKIE = 'hms_token';
const PASSTHROUGH_RESPONSE_HEADERS = ['content-type', 'content-disposition'];

/**
 * Backend-for-frontend proxy: forwards every `/api/proxy/*` call to the real backend with
 * the JWT read from the httpOnly session cookie, so client code never touches the raw
 * token. Also used for binary upload/download (attachments, prescription XML).
 */
async function forward(req: NextRequest, path: string[]) {
  const targetUrl = `${BACKEND_BASE_URL}/${path.join('/')}${req.nextUrl.search}`;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;
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
