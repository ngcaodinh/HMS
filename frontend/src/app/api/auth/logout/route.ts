import { NextResponse } from 'next/server';

import { clearSessionCookie } from '@/shared/auth/backend';

export async function POST() {
  const response = NextResponse.json({ data: { loggedOut: true } });
  clearSessionCookie(response);
  return response;
}
