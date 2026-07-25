/**
 * Public runtime config — chỉ đọc NEXT_PUBLIC_* (không secret).
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000',
} as const;
