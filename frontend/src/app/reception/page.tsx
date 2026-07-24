'use client';

import dynamic from 'next/dynamic';

/**
 * Client-only load: browser extensions (password managers, form fillers, etc.)
 * inject attributes like `fdprocessedid` onto <button> before React hydrates,
 * which triggers "Extra attributes from the server" warnings.
 * Disabling SSR for this page avoids that hydration mismatch entirely.
 */
const ReceptionWorkspacePage = dynamic(
  () =>
    import('@/modules/reception').then((mod) => mod.ReceptionWorkspacePage),
  {
    ssr: false,
    loading: () => (
      <main className="flex h-screen min-h-0 w-full items-center justify-center bg-[#f6fafe] text-sm font-medium text-[#707882]">
        Đang tải màn hình lễ tân...
      </main>
    ),
  },
);

export default function ReceptionPage() {
  return <ReceptionWorkspacePage />;
}
