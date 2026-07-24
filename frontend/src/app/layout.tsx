import type { ReactNode } from 'react';

import './globals.css';
import { QueryProvider } from '@/shared/providers/query-provider';

export const metadata = {
  title: 'HMS',
  description: 'Hospital management system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
