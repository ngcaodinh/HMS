import { redirect } from 'next/navigation';

import { AdminWorkspace } from '@/modules/admin';
import { backendFetch } from '@/shared/auth/backend';

export const metadata = {
  title: 'Quản trị hệ thống | HMS',
  description: 'Bảng điều khiển quản trị bệnh viện dành cho vai trò admin.',
};

/**
 * Guard phía server cho `/admin` trước khi render workspace quản trị.
 *
 * @returns Redirect về login khi phiên hết hạn, UI 403 khi thiếu role hoặc workspace khi hợp lệ.
 * @remarks Principal được đọc qua BFF cookie bằng `backendFetch('/auth/me')`; dữ liệu này là
 * nguồn quyết định access của page, còn UI 403 chỉ là phản hồi hiển thị và không thay thế RBAC.
 */
export default async function AdminPage() {
  const response = await backendFetch('/auth/me');

  if (response.status === 401) redirect('/login');

  const payload = await response.json();
  const { id = '', fullName = '', roleCodes = [], username = '' } = payload?.data ?? {};
  const isAdmin = roleCodes.includes('admin');

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6fafe] px-6">
        <section className="max-w-md rounded-2xl border border-[#dfe3e7] bg-white p-8 text-center shadow-hms-card">
          <p className="text-sm font-bold uppercase tracking-[0.8px] text-[#ba1a1a]">403</p>
          <h1 className="mt-2 text-xl font-bold text-[#171c1f]">Không đủ quyền truy cập</h1>
          <p className="mt-2 text-sm leading-6 text-[#3f4851]">
            Chỉ quản trị viên (admin) được mở bảng điều khiển quản trị bệnh viện.
          </p>
        </section>
      </main>
    );
  }

  return <AdminWorkspace principal={{ fullName, id, roleCodes, username }} />;
}
