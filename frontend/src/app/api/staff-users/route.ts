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
 * @remarks Query string được giữ nguyên; response và lỗi được `passthroughJson` chuyển tiếp.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  return passthroughJson(await backendFetch(`/staff-users${url.search}`));
}

/**
 * @route   POST /api/staff-users
 * @desc    Tạo tài khoản nhân viên; backend trả mật khẩu tạm thời một lần.
 * @access  staff.create cùng origin
 * @remarks Body JSON được chuyển tiếp sau same-origin guard; backend mới quyết định validation,
 * permission và nội dung credential tạm thời trong response.
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
