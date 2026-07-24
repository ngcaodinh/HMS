import { NextResponse } from 'next/server';

import { assertSameOrigin, backendBaseUrl, forbiddenOrigin, setSessionCookie } from '@/shared/auth/backend';

export async function POST(request: Request) {
  if (!assertSameOrigin()) return forbiddenOrigin();

  const response = await fetch(`${backendBaseUrl}/auth/sessions`, {
    body: await request.text(),
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  const payload = await response.json();

  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }

  const nextResponse = NextResponse.json({
    data: {
      principal: payload.data.principal,
    },
  });

  setSessionCookie(nextResponse, payload.data.accessToken);
  return nextResponse;
}
