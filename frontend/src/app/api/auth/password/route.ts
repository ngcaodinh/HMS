import {
  assertSameOrigin,
  backendFetch,
  clearSessionCookie,
  forbiddenOrigin,
  passthroughJson,
} from '@/shared/auth/backend';

export async function PUT(request: Request) {
  if (!assertSameOrigin()) return forbiddenOrigin();

  const response = await passthroughJson(
    await backendFetch('/auth/password', {
      body: await request.text(),
      method: 'PUT',
    }),
  );

  if (response.ok) clearSessionCookie(response);

  return response;
}
