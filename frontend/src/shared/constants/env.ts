/**
 * Cấu hình runtime công khai lấy từ `NEXT_PUBLIC_*`, có fallback localhost cho môi trường dev.
 * Không dùng object này để lưu hoặc truyền trạng thái phiên server-side.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000',
} as const;
