import {
  assertSameOrigin,
  backendFetch,
  forbiddenOrigin,
  passthroughJson,
} from '@/shared/auth/backend';

export async function POST(request: Request, { params }: { params: { userId: string } }) {
  if (!assertSameOrigin()) return forbiddenOrigin();

  return passthroughJson(
    await backendFetch(`/staff-users/${params.userId}/password-resets`, {
      body: await request.text(),
      method: 'POST',
    }),
  );
}
