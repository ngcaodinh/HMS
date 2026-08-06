import {
  assertSameOrigin,
  backendFetch,
  forbiddenOrigin,
  passthroughJson,
} from '@/shared/auth/backend';

/**
 * @route   PATCH /api/staff-users/:userId
 * @desc    Cập nhật tài khoản, chuyển tiếp If-Unmodified-Since để giữ optimistic lock.
 * @access  staff.update cùng origin
 * @remarks Body, status và error envelope do backend quyết định; header lock được chuyển tiếp để
 * backend phát hiện xung đột phiên bản.
 */
export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
  if (!assertSameOrigin()) return forbiddenOrigin();

  return passthroughJson(
    await backendFetch(`/staff-users/${params.userId}`, {
      body: await request.text(),
      headers: {
        'If-Unmodified-Since': request.headers.get('if-unmodified-since') ?? '',
      },
      method: 'PATCH',
    }),
  );
}
