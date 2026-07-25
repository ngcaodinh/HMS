import { NextResponse } from 'next/server';

import { clearSessionCookie } from '@/shared/auth/backend';

/**
 * @route   POST /api/auth/logout
 * @desc    Xóa cookie phiên ở BFF; backend JWT sẽ tự hết hạn theo TTL/authVersion.
 * @access  Authenticated staff
 */
export async function POST() {
  const response = NextResponse.json({ data: { loggedOut: true } });
  clearSessionCookie(response);
  return response;
}
