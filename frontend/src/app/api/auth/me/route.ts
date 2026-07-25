import { backendFetch, passthroughJson } from '@/shared/auth/backend';

/**
 * @route   GET /api/auth/me
 * @desc    Lấy principal hiện tại qua BFF để client không đọc trực tiếp JWT.
 * @access  Authenticated staff
 */
export async function GET() {
  return passthroughJson(await backendFetch('/auth/me'));
}
