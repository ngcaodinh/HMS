'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';

/**
 * Bọc toàn bộ ứng dụng bằng React Query provider ở ranh giới Client Component.
 *
 * @param children Cây route cần dùng `QueryClientProvider`.
 * @returns Provider chứa cache truy vấn của phiên render hiện tại.
 * @remarks QueryClient được khởi tạo một lần mỗi lần mount; query mặc định retry một lần và
 * không refetch khi cửa sổ nhận focus. Provider chỉ quản lý cache client, không thay thế auth/RBAC.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
