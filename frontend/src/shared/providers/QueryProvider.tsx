'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Cung cấp QueryClient dùng chung cho cây component client.
 *
 * @param children Nội dung ứng dụng cần truy cập React Query context.
 * @returns Provider bao quanh `children`.
 * @remarks QueryClient chỉ được tạo một lần cho mỗi lần mount phía client. Mặc định retry một
 * lần và coi dữ liệu là fresh trong 30 giây; provider không tự quyết định quyền truy cập.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
