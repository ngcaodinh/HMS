'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

/**
 * Cung cấp React Query context với cache mặc định riêng cho cây component được truyền vào.
 *
 * @param children Cây component cần dùng Query Client.
 * @returns `QueryClientProvider` chứa `children`.
 * @remarks Đây là Client Component; QueryClient được tạo một lần mỗi lần mount, không refetch
 * khi focus, dữ liệu fresh trong 5 phút và không ghi đè chính sách retry mặc định của TanStack Query.
 */
export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
      }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
