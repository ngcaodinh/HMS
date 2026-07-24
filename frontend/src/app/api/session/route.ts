import { NextResponse, type NextRequest } from 'next/server';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const SESSION_COOKIE = 'hms_token';

/**
 * BFF route: exchanges username/password for a backend JWT and stores it in an httpOnly
 * cookie (CLAUDE.md §6.4 — never keep the raw token in client-readable storage). Only the
 * principal (no token) is returned to the browser.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();

  const backendResponse = await fetch(`${BACKEND_BASE_URL}/auth/sessions`, {
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

/** Logs out by clearing the session cookie. */
export async function DELETE() {
  const response = NextResponse.json({ data: { loggedOut: true } });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
