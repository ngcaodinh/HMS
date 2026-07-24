import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

const sessionCookieName = 'hms_session';

export const backendBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:4000/api/v1';

export const getSessionToken = () => cookies().get(sessionCookieName)?.value;

export const setSessionCookie = (response: NextResponse, token: string) => {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    maxAge: 8 * 60 * 60,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
};

export const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set(sessionCookieName, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
};

export const assertSameOrigin = () => {
  const origin = headers().get('origin');
  const host = headers().get('host');

  if (!origin || !host) return true;

  return new URL(origin).host === host;
};

export const backendFetch = async (path: string, init: RequestInit = {}) => {
  const token = getSessionToken();

  return fetch(`${backendBaseUrl}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
};

export const passthroughJson = async (response: Response) => {
  const body = await response.text();
  const nextResponse = new NextResponse(body, {
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json',
    },
    status: response.status,
  });

  if (response.status === 401) clearSessionCookie(nextResponse);

  return nextResponse;
};

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
