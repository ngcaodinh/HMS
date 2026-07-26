import {
  assertSameOrigin,
  backendFetch,
  forbiddenOrigin,
  passthroughJson,
} from '@/shared/auth/backend';

/**
 * @route   GET /api/staff-users
 * @desc    Proxy danh sách nhân viên qua backend để áp dụng RBAC tập trung.
 * @access  staff.read
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  return passthroughJson(await backendFetch(`/staff-users${url.search}`));
}

/**
 * @route   POST /api/staff-users
 * @desc    Tạo tài khoản nhân viên; backend trả mật khẩu tạm thời một lần.
 * @access  staff.create cùng origin
 */
export async function POST(request: Request) {
  if (!assertSameOrigin()) return forbiddenOrigin();

  return passthroughJson(
    await backendFetch('/staff-users', {
      body: await request.text(),
      method: 'POST',
    }),
  );
}
