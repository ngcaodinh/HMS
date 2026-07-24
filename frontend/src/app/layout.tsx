import type { ReactNode } from 'react';

import './globals.css';

export const metadata = {
  title: 'HMS',
  description: 'Hospital management system',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/hms-login-logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/hms-login-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
