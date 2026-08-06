import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../api-client';
import type { Principal } from '../types/principal';

/**
 * Đọc principal hiện tại qua route BFF `/api/proxy/auth/me` (backend path `/auth/me`) cùng origin.
 * @returns React Query object với `data`, loading/error state và trạng thái cache của principal.
 * @remarks Query key cố định là `['auth', 'me']`; response envelope được `apiGet` unwrap. Hook
 * tắt retry để lỗi session/authorization đi thẳng tới UI hoặc `useRequireAuth`, còn lifecycle
 * request/cache do React Query quản lý.
 */
export function useCurrentPrincipal() {
  return useQuery<Principal>({
    queryKey: ['auth', 'me'],
    queryFn: () => apiGet<Principal>('/auth/me'),
    retry: false,
  });
}
