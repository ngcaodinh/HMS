import {
  assertSameOrigin,
  backendFetch,
  forbiddenOrigin,
  passthroughJson,
} from '@/shared/auth/backend';

/**
 * @route   POST /api/staff-users/:userId/password-resets
 * @desc    Reset mật khẩu nhân viên và trả secret tạm thời qua envelope không cache.
 * @access  staff.password.reset cùng origin
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
