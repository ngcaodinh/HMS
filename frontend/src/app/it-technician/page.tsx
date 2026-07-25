import { redirect } from 'next/navigation';

import { ItTechnicianWorkspace } from '@/modules/it';
import { backendFetch } from '@/shared/auth/backend';

export const metadata = {
  title: 'IT Technician | HMS',
  description: 'Workspace for IT technicians in HMS.',
};

/**
 * Server-side guard cho /it-technician để không render workspace khi thiếu role.
 * Đọc principal qua BFF cookie, redirect về login khi hết phiên và trả UI 403 khi thiếu quyền.
 */
export default async function ItTechnicianPage() {
  const response = await backendFetch('/auth/me');

  if (response.status === 401) redirect('/login');

  const payload = await response.json();
  const roleCodes = payload?.data?.roleCodes ?? [];
  const canManageStaff = roleCodes.includes('it_tech') || roleCodes.includes('admin');

  if (!canManageStaff) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <section className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.8px] text-red-700">403</p>
          <h1 className="mt-2 text-xl font-bold text-slate-950">Không đủ quyền truy cập</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Chỉ kỹ thuật IT hoặc admin được mở màn hình quản lý tài khoản nhân viên.
          </p>
        </section>
      </main>
    );
  }

  return <ItTechnicianWorkspace principal={{ roleCodes }} />;
}
