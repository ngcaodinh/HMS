import type { ReactNode } from 'react';

import './globals.css';
import { Providers } from './providers';

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
