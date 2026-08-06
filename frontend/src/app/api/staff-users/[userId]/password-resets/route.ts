import {
  assertSameOrigin,
  backendFetch,
  forbiddenOrigin,
  passthroughJson,
} from '@/shared/auth/backend';

/**
 * @route   POST /api/staff-users/:userId/password-resets
 * @desc    Yêu cầu backend reset mật khẩu và chuyển credential tạm thời qua envelope không cache.
 * @access  staff.password.reset cùng origin
 * @remarks Body và response/error envelope được giữ qua `passthroughJson`; backend xác thực
 * permission, còn route chỉ thêm same-origin guard cho mutation.
 */
export async function POST(request: Request, { params }: { params: { userId: string } }) {
  if (!assertSameOrigin()) return forbiddenOrigin();

  return passthroughJson(
    await backendFetch(`/staff-users/${params.userId}/password-resets`, {
      body: await request.text(),
      method: 'POST',
    }),
  );
}
