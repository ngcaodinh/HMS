import type { ReactNode } from 'react';

import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
