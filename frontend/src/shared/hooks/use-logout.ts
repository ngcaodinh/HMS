'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Tạo action logout qua BFF rồi xóa cache React Query và chuyển về `/login`.
 * @returns Hàm async không nhận tham số; hoàn tất sau request `DELETE /api/session` và navigation.
 * @remarks Không retry và không bắt lỗi: nếu request thất bại, cache không bị xóa và router không
 * được gọi. Khi thành công, `queryClient.clear()` xóa cả server state đang cache; backend/BFF vẫn
 * là nơi kết thúc session thực tế.
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return async function logout() {
    await fetch('/api/session', { method: 'DELETE' });
    queryClient.clear();
    router.push('/login');
  };
}
