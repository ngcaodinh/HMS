import {
  assertSameOrigin,
  backendFetch,
  forbiddenOrigin,
  passthroughJson,
} from '@/shared/auth/backend';

export async function GET(request: Request) {
  const url = new URL(request.url);
  return passthroughJson(await backendFetch(`/staff-users${url.search}`));
}

export async function POST(request: Request) {
  if (!assertSameOrigin()) return forbiddenOrigin();

  return passthroughJson(
    await backendFetch('/staff-users', {
      body: await request.text(),
      method: 'POST',
    }),
  );
}
