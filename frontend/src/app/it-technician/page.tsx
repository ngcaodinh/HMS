import { redirect } from 'next/navigation';

import { ItTechnicianWorkspace } from '@/modules/it';
import { backendFetch } from '@/shared/auth/backend';

export const metadata = {
  title: 'IT Technician | HMS',
  description: 'Workspace for IT technicians in HMS.',
};

/**
 * Guard phía server cho `/it-technician` trước khi render workspace quản lý nhân viên.
 *
 * @returns Redirect về login khi hết phiên; UI 403 khi thiếu role; hoặc workspace quản lý staff
 * khi principal hợp lệ.
 * @remarks Dữ liệu principal được đọc từ `GET /auth/me` qua BFF cookie. UI chỉ cho phép role
 * `it_tech`/`admin` mở route; permission chi tiết và audit của từng API action vẫn do backend
 * quyết định.
 */
export default async function ItTechnicianPage() {
  const response = await backendFetch('/auth/me');

  if (response.status === 401) redirect('/login');

  const payload = await response.json();
  const { id = '', roleCodes = [] } = payload?.data ?? {};
  const canManageStaff = roleCodes.includes('it_tech') || roleCodes.includes('admin');

  if (!canManageStaff) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6fafe] px-6">
        <section className="max-w-md rounded-2xl border border-[#dfe3e7] bg-white p-8 text-center shadow-hms-card">
          <p className="text-sm font-bold uppercase tracking-[0.8px] text-[#ba1a1a]">403</p>
          <h1 className="mt-2 text-xl font-bold text-[#171c1f]">Không đủ quyền truy cập</h1>
          <p className="mt-2 text-sm leading-6 text-[#3f4851]">
            Chỉ kỹ thuật IT hoặc admin được mở màn hình quản lý tài khoản nhân viên.
          </p>
        </section>
      </main>
    );
  }

  return <ItTechnicianWorkspace principal={{ id, roleCodes }} />;
}
