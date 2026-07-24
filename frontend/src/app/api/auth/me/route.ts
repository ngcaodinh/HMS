import { backendFetch, passthroughJson } from '@/shared/auth/backend';

export async function GET() {
  return passthroughJson(await backendFetch('/auth/me'));
}
