import { NextResponse } from 'next/server';

import { clearSessionCookie } from '@/shared/auth/backend';

/**
 * @route   POST /api/auth/logout
 * @desc    Xóa cookie phiên ở BFF để kết thúc trạng thái đăng nhập phía trình duyệt.
 * @access  Public; handler không yêu cầu JWT và không gọi backend.
 * @remarks Có thể gọi khi phiên đã hết hạn; response luôn trả envelope thành công và cookie bị xóa.
 */
export async function POST() {
  const response = NextResponse.json({ data: { loggedOut: true } });
  clearSessionCookie(response);
  return response;
}
