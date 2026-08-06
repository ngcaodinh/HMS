import type { ReactNode } from 'react';

import './globals.css';
import { Providers } from './Providers';

/** Metadata dùng chung cho document HTML của toàn bộ ứng dụng HMS. */
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

/**
 * Tạo document HTML gốc và cung cấp Query Client cho mọi route trong App Router.
 *
 * @param children Nội dung route hiện tại được render bên trong body.
 * @returns Cây HTML gốc với `Providers` ở client boundary.
 * @remarks Layout này là Server Component; nó không tự xác thực session hay role. Middleware
 * và từng route/workspace chịu trách nhiệm cho access boundary, còn provider quản lý cache client.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
