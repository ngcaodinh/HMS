import { backendFetch, passthroughJson } from '@/shared/auth/backend';

/**
 * @route   GET /api/auth/me
 * @desc    Lấy principal hiện tại qua BFF để client không đọc trực tiếp JWT.
 * @access  Authenticated staff
 * @remarks `backendFetch` đọc session cookie ở server và `passthroughJson` giữ nguyên status cùng
 * error envelope từ backend, gồm cả trường hợp chưa xác thực.
 */
export async function GET() {
  return passthroughJson(await backendFetch('/auth/me'));
}
