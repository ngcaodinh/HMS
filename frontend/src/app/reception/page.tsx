'use client';

import dynamic from 'next/dynamic';

/**
 * Client-only load để tránh hydration mismatch do extension trình duyệt chèn thuộc tính vào
 * button trước khi React hydrate. `ssr: false` giữ nguyên boundary hiện tại; loading fallback
 * được hiển thị trong lúc workspace lễ tân tải.
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

/**
 * Route shell cho workspace lễ tân.
 *
 * @returns Workspace client-only hoặc trạng thái loading trong dynamic import.
 * @remarks Middleware kiểm tra session/role trước route; page chỉ điều phối tải workspace, còn
 * queue, tiếp nhận, lỗi và mutation do component/module cùng backend xử lý.
 */
export default function ReceptionPage() {
  return <ReceptionWorkspacePage />;
}
